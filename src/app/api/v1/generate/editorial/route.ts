import { NextRequest, NextResponse } from 'next/server';
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
 * Body:
 *  - outfitImage  (string, required): Base64 data URI of the outfit/garment image
 *  - modelData    (object, optional): AI model attributes { id, name, age, ethnicity, bodyType, tags, avatar, sex }
 *  - modelId      (string, optional): UUID of an existing AI model to use (fetched from DB)
 *  - background   (string, optional): Background style
 *  - aspectRatio  (string, optional): '1:1' | '4:5' | '9:16'
 *  - campaignId   (string, optional): UUID of the campaign to associate
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
        const { outfitImage, modelData, modelId, background, aspectRatio, campaignId } = body;

        if (!outfitImage) {
            return NextResponse.json(
                { error: 'outfitImage is required (base64 data URI).' },
                { status: 400 },
            );
        }

        const startTime = Date.now();

        // Resolve model data — either from request body or from DB
        let resolvedModelData = modelData;
        if (!resolvedModelData && modelId) {
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
            }
        }

        // Parse aspect ratio to dimensions
        let width = 1024;
        let height = 1024;
        if (aspectRatio === '4:5') {
            width = 896;
            height = 1120;
        } else if (aspectRatio === '9:16') {
            width = 720;
            height = 1280;
        }

        // Build background prompt
        const bgMap: Record<string, string> = {
            'studio': 'in a clean white photography studio with professional lighting',
            'outdoor': 'on a bright urban street during daytime with natural sunlight',
            'cafe': 'in a cozy indoor café with warm ambient lighting',
            'natural': 'in natural daylight with soft diffused lighting',
            // Japanese labels (from dashboard UI)
            'スタジオ（白背景）': 'in a clean white photography studio with professional lighting',
            'ストリート（昼）': 'on a bright urban street during daytime with natural sunlight',
            'カフェ（屋内）': 'in a cozy indoor café with warm ambient lighting',
            '自然光': 'in natural daylight with soft diffused lighting',
        };
        const bgPrompt = bgMap[background || 'studio'] || bgMap['studio'];

        // Build style prompt from model data
        let stylePrompt: string;
        if (resolvedModelData) {
            const rosterModel: AIModel = {
                id: resolvedModelData.id || 'api',
                name: resolvedModelData.name || 'Model',
                avatar: '',
                tags: resolvedModelData.tags || [],
                isActive: true,
                bodyType: resolvedModelData.bodyType || 'Slim',
                isLocked: false,
                age: resolvedModelData.age,
                ethnicity: resolvedModelData.ethnicity,
                sex: resolvedModelData.sex || 'female',
            };
            stylePrompt = buildModelPrompt(rosterModel);
        } else {
            stylePrompt = 'a Japanese fashion model with natural makeup, elegant pose, slim build';
        }

        const modelPrompt = `Full-body professional fashion photograph of ${stylePrompt}, standing ${bgPrompt}. Photorealistic, high quality fashion photography, 8k resolution, sharp focus, professional studio lighting.`;

        const segmind = createSegmindClient();

        // Step 1: Generate model image
        const modelResult = await segmind.generateImage({
            prompt: modelPrompt,
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
            return NextResponse.json(
                { error: 'Failed to generate model image' },
                { status: 500 },
            );
        }

        // Step 2: Upload images to get URLs
        const [outfitUrl, generatedModelUrl] = await Promise.all([
            uploadImageToStorage(outfitImage, 'outfits'),
            uploadImageToStorage(modelResult.image, 'models'),
        ]);

        // Step 3: Face swap (if model avatar available)
        const modelAvatarUrl = resolvedModelData?.avatar;
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

        // Step 4: Virtual try-on
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

        // Save to database
        const { data: generation } = await adminClient
            .from('generations')
            .insert({
                user_id: userId,
                campaign_id: campaignId || null,
                ai_model_id: resolvedModelData?.id || null,
                original_image_url: outfitUrl,
                generated_image_url: generatedImageUrl,
                model_type: 'full-pipeline',
                background: background || null,
                aspect_ratio: aspectRatio || '1:1',
                status: 'completed',
            })
            .select()
            .single();

        return NextResponse.json({
            success: true,
            image_url: generatedImageUrl,
            generation_id: generation?.id || null,
            generation_time: `${generationTime}s`,
            credits_used: 1,
        });
    } catch (error) {
        console.error('[api/v1/generate/editorial] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Editorial generation failed' },
            { status: 500 },
        );
    }
}
