import { NextRequest, NextResponse, after } from 'next/server';
import { authenticateApiRequest } from '@/utils/api-auth';
import { createSegmindClient } from '@/utils/segmind';
import { buildModelPrompt, type AIModel } from '@/types/models';
import { uploadImageToStorage, getAdminClient } from '@/utils/storage';
import { canGenerateImage } from '@/utils/plan-limits';

export const maxDuration = 120;

/**
 * POST /api/v1/generate/editorial
 *
 * Full editorial pipeline: generates an AI model image, applies face swap
 * (if model avatar provided), and performs virtual try-on with the outfit.
 *
 * Returns a task_id immediately. Use GET /api/v1/tasks/:taskId to poll for results.
 *
 * Task statuses:
 *  - processing : Task is still running
 *  - completed  : Task finished — result contains image_url, generation_id, etc.
 *  - failed     : Task encountered an error — error field is populated
 *
 * Outfit/Product source (one of):
 *  - outfitImage    (string): Base64 data URI of the outfit/garment image
 *  - productId      (string): UUID of an existing product (uses its image_url)
 *  - createProduct  (boolean): If true, generate a product image inline
 *    - productPrompt (string, required): AI prompt for product generation
 *    - productName   (string, required): Product name
 *    - productCategory (string, optional)
 *    - productTags    (string[], optional)
 *
 * Model source (one of):
 *  - modelId        (string): UUID of an existing AI model
 *  - modelData      (object): Inline model attributes { id, name, age, ethnicity, bodyType, tags, avatar, sex }
 *  - createModel    (boolean): If true, generate a model inline
 *    - modelPrompt   (string, required): AI prompt for model generation
 *    - modelName     (string, optional): Model name
 *    - sex           (string, optional): 'male' | 'female' (default: 'female')
 *    - age           (number, optional)
 *    - ethnicity     (string, optional)
 *    - bodyType      (string, optional)
 *    - modelTags     (string[], optional)
 *
 * Campaign:
 *  - campaignId     (string, optional): UUID of existing campaign
 *  - campaignName   (string, optional): Create campaign if it doesn't exist
 *
 * Other:
 *  - background     (string, optional): Background style
 *  - aspectRatio    (string, optional): '1:1' | '4:5' | '9:16'
 */
export async function POST(request: NextRequest) {
    const auth = await authenticateApiRequest(request);
    if ('error' in auth) return auth.error;

    const { userId, plan } = auth.user;

    try {
        // Check quota
        const adminClient = getAdminClient();
        const allowed = await canGenerateImage(adminClient, userId, plan);
        if (!allowed) {
            return NextResponse.json(
                { error: 'Monthly image generation limit reached. Please upgrade your plan.' },
                { status: 429 },
            );
        }

        const body = await request.json();
        const {
            // Outfit sources
            outfitImage, productId, createProduct,
            productPrompt, productName, productDescription, productCategory, productTags,
            // Model sources
            modelData, modelId, createModel,
            modelPrompt, modelName, sex, age, ethnicity, bodyType, modelTags,
            // Campaign
            campaignId, campaignName,
            // Other
            background, aspectRatio,
        } = body;

        // ── Validate required inputs before creating the task ───────
        if (createProduct) {
            if (!productPrompt) {
                return NextResponse.json(
                    { error: 'productPrompt is required when createProduct is true.' },
                    { status: 400 },
                );
            }
            if (!productName) {
                return NextResponse.json(
                    { error: 'productName is required when createProduct is true.' },
                    { status: 400 },
                );
            }
        }

        if (!outfitImage && !productId && !createProduct) {
            return NextResponse.json(
                { error: 'An outfit source is required: outfitImage (base64), productId, or createProduct with productPrompt.' },
                { status: 400 },
            );
        }

        if (createModel && !modelPrompt) {
            return NextResponse.json(
                { error: 'modelPrompt is required when createModel is true.' },
                { status: 400 },
            );
        }

        // ── Create task record and return immediately ───────────────
        const { data: task, error: taskError } = await adminClient
            .from('editorial_tasks')
            .insert({
                user_id: userId,
                status: 'processing',
                input: body,
            })
            .select('id')
            .single();

        if (taskError || !task) {
            console.error('Failed to create editorial task:', taskError);
            return NextResponse.json(
                { error: 'Failed to create editorial task.' },
                { status: 500 },
            );
        }

        const taskId = task.id;

        // ── Run the pipeline after the response is sent ─────────────
        // Using Next.js after() to keep the serverless function alive
        // until the pipeline completes, preventing tasks from getting
        // stuck in "processing" status indefinitely.
        after(async () => {
            try {
                await processEditorialPipeline({
                    taskId,
                    userId,
                    body: {
                        outfitImage, productId, createProduct,
                        productPrompt, productName, productDescription, productCategory, productTags,
                        modelData, modelId, createModel,
                        modelPrompt, modelName, sex, age, ethnicity, bodyType, modelTags,
                        campaignId, campaignName,
                        background, aspectRatio,
                    },
                });
            } catch (err) {
                console.error(`[editorial task ${taskId}] Unhandled error:`, err);
                try {
                    await adminClient
                        .from('editorial_tasks')
                        .update({
                            status: 'failed',
                            error: err instanceof Error ? err.message : String(err),
                        })
                        .eq('id', taskId);
                } catch (updateErr) {
                    console.error(`[editorial task ${taskId}] Failed to update task status:`, updateErr);
                }
            }
        });

        return NextResponse.json({
            task_id: taskId,
            status: 'processing',
            message: 'Editorial generation started. Use GET /api/v1/tasks/:taskId to check status.',
        }, { status: 202 });
    } catch (error) {
        console.error('[api/v1/generate/editorial] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Editorial generation failed' },
            { status: 500 },
        );
    }
}

// ── Background pipeline ─────────────────────────────────────────────
interface PipelineParams {
    taskId: string;
    userId: string;
    body: {
        outfitImage?: string;
        productId?: string;
        createProduct?: boolean;
        productPrompt?: string;
        productName?: string;
        productDescription?: string;
        productCategory?: string;
        productTags?: string[];
        modelData?: Record<string, unknown>;
        modelId?: string;
        createModel?: boolean;
        modelPrompt?: string;
        modelName?: string;
        sex?: string;
        age?: number;
        ethnicity?: string;
        bodyType?: string;
        modelTags?: string[];
        campaignId?: string;
        campaignName?: string;
        background?: string;
        aspectRatio?: string;
    };
}

async function processEditorialPipeline({ taskId, userId, body }: PipelineParams) {
    const adminClient = getAdminClient();

    try {
        const {
            outfitImage, productId, createProduct,
            productPrompt, productName, productDescription, productCategory, productTags,
            modelData: inputModelData, modelId, createModel,
            modelPrompt, modelName, sex, age, ethnicity, bodyType, modelTags,
            campaignId, campaignName,
            background, aspectRatio,
        } = body;

        const startTime = Date.now();
        const segmind = createSegmindClient();

        // ── Resolve campaign ────────────────────────────────────────
        let resolvedCampaignId: string | null = campaignId || null;

        if (!resolvedCampaignId && campaignName) {
            const { data: existing } = await adminClient
                .from('campaigns')
                .select('id')
                .eq('user_id', userId)
                .eq('name', campaignName)
                .limit(1)
                .single();

            if (existing) {
                resolvedCampaignId = existing.id;
            } else {
                const { data: newCampaign, error: campError } = await adminClient
                    .from('campaigns')
                    .insert({ user_id: userId, name: campaignName, status: 'active' })
                    .select('id')
                    .single();

                if (campError) {
                    throw new Error(`Campaign creation failed: ${campError.message}`);
                }
                resolvedCampaignId = newCampaign.id;
            }
        }

        // ── Resolve outfit image ────────────────────────────────────
        let resolvedOutfitImage: string | null = outfitImage || null;
        let createdProductId: string | null = null;

        if (createProduct) {
            const productResult = await segmind.generateImage({
                prompt: productPrompt!.trim(),
                negative_prompt: 'person, model, mannequin, low quality, blurry, deformed',
                steps: 8,
                guidance_scale: 1,
                seed: -1,
                width: 768,
                height: 768,
                image_format: 'webp',
                quality: 90,
                base_64: false,
            });

            if (!productResult.image) {
                throw new Error('Failed to generate product image.');
            }

            const productImageUrl = await uploadImageToStorage(productResult.image, 'products');

            const { data: product, error: prodError } = await adminClient
                .from('products')
                .insert({
                    user_id: userId,
                    campaign_id: resolvedCampaignId,
                    name: productName!.trim(),
                    description: productDescription || null,
                    image_url: productImageUrl,
                    category: productCategory || null,
                    tags: productTags || [],
                    is_active: true,
                })
                .select('id, image_url')
                .single();

            if (prodError) {
                throw new Error(`Product creation failed: ${prodError.message}`);
            }

            resolvedOutfitImage = product.image_url;
            createdProductId = product.id;
        } else if (productId) {
            const { data: dbProduct } = await adminClient
                .from('products')
                .select('id, image_url')
                .eq('id', productId)
                .eq('user_id', userId)
                .single();

            if (!dbProduct) {
                throw new Error('Product not found.');
            }
            resolvedOutfitImage = dbProduct.image_url;
            createdProductId = dbProduct.id;
        }

        if (!resolvedOutfitImage) {
            throw new Error('An outfit source is required: outfitImage (base64), productId, or createProduct with productPrompt.');
        }

        // ── Resolve model ───────────────────────────────────────────
        let resolvedModelData = inputModelData;
        let resolvedModelId: string | null = null;

        if (createModel) {
            const modelImageResult = await segmind.generateImage({
                prompt: modelPrompt!.trim(),
                steps: 8,
                guidance_scale: 1,
                seed: -1,
                width: 1024,
                height: 1024,
                image_format: 'png',
                quality: 95,
                base_64: false,
            });

            if (!modelImageResult.image) {
                throw new Error('Failed to generate model image.');
            }

            const modelThumbnailUrl = await uploadImageToStorage(modelImageResult.image, `models/${userId}`);

            const modelMetadata = {
                bodyType: bodyType || 'Slim',
                tags: modelTags || [],
                age: age,
                ethnicity: ethnicity,
                sex: sex || 'female',
            };

            const { data: newModel, error: modelError } = await adminClient
                .from('ai_models')
                .insert({
                    user_id: userId,
                    name: (modelName || 'Generated Model').trim(),
                    type: 'ai-generated',
                    thumbnail_url: modelThumbnailUrl,
                    model_data: modelMetadata,
                })
                .select('id, name, thumbnail_url, model_data')
                .single();

            if (modelError) {
                throw new Error(`Model creation failed: ${modelError.message}`);
            }

            resolvedModelData = {
                id: newModel.id,
                name: newModel.name,
                avatar: newModel.thumbnail_url,
                ...newModel.model_data,
            };
            resolvedModelId = newModel.id;
        } else if (!resolvedModelData && modelId) {
            const { data: dbModel } = await adminClient
                .from('ai_models')
                .select('id, name, thumbnail_url, model_data')
                .eq('id', modelId)
                .eq('user_id', userId)
                .single();

            if (dbModel) {
                resolvedModelData = {
                    id: dbModel.id,
                    name: dbModel.name,
                    avatar: dbModel.thumbnail_url,
                    ...dbModel.model_data,
                };
                resolvedModelId = dbModel.id;
            }
        }

        if (resolvedModelData?.id) {
            resolvedModelId = resolvedModelData.id as string;
        }

        // ── Parse aspect ratio to dimensions ────────────────────────
        let width = 1024;
        let height = 1024;
        if (aspectRatio === '4:5') {
            width = 896;
            height = 1120;
        } else if (aspectRatio === '9:16') {
            width = 720;
            height = 1280;
        }

        // ── Build background prompt ─────────────────────────────────
        const bgMap: Record<string, string> = {
            'studio': 'in a clean white photography studio with professional lighting',
            'outdoor': 'on a bright urban street during daytime with natural sunlight',
            'cafe': 'in a cozy indoor café with warm ambient lighting',
            'natural': 'in natural daylight with soft diffused lighting',
            'スタジオ（白背景）': 'in a clean white photography studio with professional lighting',
            'ストリート（昼）': 'on a bright urban street during daytime with natural sunlight',
            'カフェ（屋内）': 'in a cozy indoor café with warm ambient lighting',
            '自然光': 'in natural daylight with soft diffused lighting',
        };
        const bgPrompt = bgMap[background || 'studio'] || bgMap['studio'];

        // ── Build style prompt from model data ──────────────────────
        let stylePrompt: string;
        if (resolvedModelData) {
            const rosterModel: AIModel = {
                id: (resolvedModelData.id as string) || 'api',
                name: (resolvedModelData.name as string) || 'Model',
                avatar: '',
                tags: (resolvedModelData.tags as string[]) || [],
                isActive: true,
                bodyType: (resolvedModelData.bodyType as AIModel['bodyType']) || 'Slim',
                isLocked: false,
                age: resolvedModelData.age as number | undefined,
                ethnicity: resolvedModelData.ethnicity as string | undefined,
                sex: (resolvedModelData.sex as AIModel['sex']) || 'female',
            };
            stylePrompt = buildModelPrompt(rosterModel);
        } else {
            stylePrompt = 'a Japanese fashion model with natural makeup, elegant pose, slim build';
        }

        const fullModelPrompt = `Full-body professional fashion photograph of ${stylePrompt}, standing ${bgPrompt}. Photorealistic, high quality fashion photography, 8k resolution, sharp focus, professional studio lighting.`;

        // ── Step 1: Generate model image ────────────────────────────
        let generatedModelUrl: string;

        if (createModel && resolvedModelData?.avatar) {
            const modelResult = await segmind.generateImage({
                prompt: fullModelPrompt,
                width,
                height,
                steps: 8,
                guidance_scale: 1,
                seed: -1,
                image_format: 'png',
                quality: 95,
                base_64: false,
            });

            if (!modelResult.image) {
                throw new Error('Failed to generate full-body model image.');
            }
            generatedModelUrl = await uploadImageToStorage(modelResult.image, 'models');
        } else {
            const modelResult = await segmind.generateImage({
                prompt: fullModelPrompt,
                width,
                height,
                steps: 8,
                guidance_scale: 1,
                seed: -1,
                image_format: 'png',
                quality: 95,
                base_64: false,
            });

            if (!modelResult.image) {
                throw new Error('Failed to generate model image.');
            }
            generatedModelUrl = await uploadImageToStorage(modelResult.image, 'models');
        }

        // ── Step 2: Upload outfit image (if it's a data URI) ────────
        let outfitUrl = resolvedOutfitImage;
        if (resolvedOutfitImage.startsWith('data:')) {
            outfitUrl = await uploadImageToStorage(resolvedOutfitImage, 'outfits');
        }

        // ── Step 3: Face swap (if model avatar available) ───────────
        const modelAvatarUrl = resolvedModelData?.avatar as string | undefined;
        let faceSwappedModelUrl = generatedModelUrl;

        if (modelAvatarUrl) {
            try {
                const faceSwapResult = await segmind.faceSwap({
                    source_image: modelAvatarUrl,
                    target_image: generatedModelUrl,
                    image_format: 'png',
                    quality: 95,
                });

                if (faceSwapResult.image) {
                    faceSwappedModelUrl = await uploadImageToStorage(faceSwapResult.image, 'faceswapped');
                }
            } catch (faceSwapErr) {
                console.error('Face swap failed, proceeding without it:', faceSwapErr);
            }
        }

        // ── Step 4: Virtual try-on ──────────────────────────────────
        const result = await segmind.virtualTryOn({
            outfit_image: outfitUrl,
            model_image: faceSwappedModelUrl,
            model_type: 'Quality',
            cn_strength: 0.8,
            cn_end: 0.5,
            image_format: 'png',
            image_quality: 95,
            seed: 42,
            base64: false,
        });

        // Upload generated image
        let generatedImageUrl = result.image;
        if (result.image && result.image.startsWith('data:')) {
            generatedImageUrl = await uploadImageToStorage(result.image, 'generated');
        }

        const generationTime = ((Date.now() - startTime) / 1000).toFixed(1);

        // ── Save to generations table ───────────────────────────────
        const { data: generation } = await adminClient
            .from('generations')
            .insert({
                user_id: userId,
                campaign_id: resolvedCampaignId,
                ai_model_id: resolvedModelId || null,
                original_image_url: outfitUrl,
                generated_image_url: generatedImageUrl,
                model_type: 'full-pipeline',
                background: background || null,
                aspect_ratio: aspectRatio || '1:1',
                status: 'completed',
            })
            .select()
            .single();

        // ── Mark task as completed ──────────────────────────────────
        await adminClient
            .from('editorial_tasks')
            .update({
                status: 'completed',
                result: {
                    success: true,
                    image_url: generatedImageUrl,
                    generation_id: generation?.id || null,
                    generation_time: `${generationTime}s`,
                    credits_used: 1,
                    ...(createdProductId && { product_id: createdProductId }),
                    ...(resolvedModelId && { model_id: resolvedModelId }),
                    ...(resolvedCampaignId && { campaign_id: resolvedCampaignId }),
                },
            })
            .eq('id', taskId);

    } catch (error) {
        console.error(`[editorial task ${taskId}] Pipeline error:`, error);

        await adminClient
            .from('editorial_tasks')
            .update({
                status: 'failed',
                error: error instanceof Error ? error.message : 'Editorial generation failed',
            })
            .eq('id', taskId);
    }
}
