import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createSegmindClient, buildSeedreamPrompt, type SeedreamProductInput, type ProductType } from '@/utils/segmind';
import { buildModelPrompt, type AIModel } from '@/types/models';
import { uploadImageToStorage, getAdminClient } from '@/utils/storage';
import { canGenerateImage } from '@/utils/plan-limits';

export const maxDuration = 120; // Allow up to 2 minutes for generation

/**
 * Helper to send a Server-Sent Events message
 */
function sseMessage(event: string, data: Record<string, unknown>): string {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
    // Set up SSE streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendEvent = async (event: string, data: Record<string, unknown>) => {
        await writer.write(encoder.encode(sseMessage(event, data)));
    };

    // Run the pipeline in the background while streaming events
    (async () => {
        try {
            // Check authentication using cookie-based client
            const supabase = await createClient();
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                await sendEvent('error', { error: 'Unauthorized' });
                await writer.close();
                return;
            }

            // Use admin client for all DB operations to avoid RLS issues
            // in the streaming SSE context (cookie-based auth can become
            // stale during the long-running generation pipeline).
            const adminClient = getAdminClient();

            // Check image generation quota
            const { data: profile } = await adminClient
                .from('profiles')
                .select('plan')
                .eq('id', user.id)
                .single();
            const userPlan = profile?.plan || 'starter';
            const allowed = await canGenerateImage(adminClient, user.id, userPlan);
            if (!allowed) {
                await sendEvent('error', { error: '今月の画像生成上限に達しました。プランをアップグレードしてください。' });
                await writer.close();
                return;
            }

            const body = await request.json();
            const {
                mode, // 'seedream' | 'generate' | 'faceswap' (legacy)
                // Seedream mode fields
                products: productInputs,   // Array of { imageUrl, productType, name } — already public URLs
                outfitImage,               // single base64 outfit image (backward compat)
                customPrompt,              // optional user custom prompt
                // Common fields
                aspectRatio,
                campaignId,
                background,
                modelData,     // model roster data { id, name, age, ethnicity, bodyType, tags, avatar, sex }
                // Legacy fields for backward compat
                modelImage,
                clothImage,
                sourceImage,
                targetImage,
                prompt,
            } = body;

            const segmind = createSegmindClient();
            let result;

            switch (mode) {
                case 'seedream':
                case 'full-pipeline': {
                    // ============================================================
                    // Seedream 4.5 Single-Step Pipeline:
                    //   Generates a photorealistic image with the model wearing
                    //   all selected products using multi-image input.
                    // ============================================================

                    // Collect all product image URLs
                    const seedreamProducts: SeedreamProductInput[] = [];
                    const imageInputUrls: string[] = [];

                    // Add the model's face/avatar as the first reference image
                    const modelAvatarUrl = modelData?.avatar;
                    if (modelAvatarUrl) {
                        imageInputUrls.push(modelAvatarUrl);
                    }

                    // Process products array (new multi-product flow)
                    if (productInputs && Array.isArray(productInputs) && productInputs.length > 0) {
                        for (const p of productInputs) {
                            let url = p.imageUrl;
                            // If it's a base64 data URI, upload it first
                            if (url && url.startsWith('data:')) {
                                url = await uploadImageToStorage(url, 'outfits');
                            }
                            if (url) {
                                imageInputUrls.push(url);
                                seedreamProducts.push({
                                    imageUrl: url,
                                    productType: (p.productType as ProductType) || 'top',
                                    name: p.name,
                                });
                            }
                        }
                    }

                    // Backward compat: single outfitImage
                    if (seedreamProducts.length === 0 && outfitImage) {
                        const outfitUrl = outfitImage.startsWith('data:')
                            ? await uploadImageToStorage(outfitImage, 'outfits')
                            : outfitImage;
                        imageInputUrls.push(outfitUrl);
                        seedreamProducts.push({
                            imageUrl: outfitUrl,
                            productType: 'top',
                            name: undefined,
                        });
                    }

                    if (seedreamProducts.length === 0 && !modelAvatarUrl) {
                        await sendEvent('error', { error: '商品またはモデルの画像が必要です。' });
                        await writer.close();
                        return;
                    }

                    // Map aspect ratio to Seedream format
                    let seedreamAspect = '1:1';
                    let width = 2048;
                    let height = 2048;
                    if (aspectRatio === '4:5') {
                        seedreamAspect = '4:5';
                        width = 1640;
                        height = 2048;
                    } else if (aspectRatio === '9:16') {
                        seedreamAspect = '9:16';
                        width = 1152;
                        height = 2048;
                    }

                    // Build background description
                    const bgMap: Record<string, string> = {
                        'スタジオ（白背景）': 'against a clean white photography studio background with professional lighting',
                        'ストリート（昼）': 'against a bright urban street background during daytime with natural sunlight',
                        'カフェ（屋内）': 'in a cozy indoor café with warm ambient lighting',
                        '自然光': 'in natural daylight with soft diffused lighting outdoors',
                    };
                    const bgPrompt = background ? (bgMap[background] ?? bgMap['スタジオ（白背景）']) : '';

                    // Build model description
                    let modelDescription: string;
                    if (modelData) {
                        const rosterModel: AIModel = {
                            id: modelData.id,
                            name: modelData.name,
                            avatar: '',
                            tags: modelData.tags || [],
                            isActive: true,
                            bodyType: modelData.bodyType || 'Slim',
                            isLocked: false,
                            age: modelData.age,
                            ethnicity: modelData.ethnicity,
                            sex: modelData.sex || 'female',
                        };
                        modelDescription = buildModelPrompt(rosterModel);
                    } else {
                        modelDescription = 'a fashion model with natural makeup, elegant pose';
                    }

                    // Build the prompt
                    const seedreamPrompt = buildSeedreamPrompt({
                        modelDescription,
                        products: seedreamProducts,
                        background: bgPrompt,
                        customPrompt: customPrompt,
                    });

                    // ── Single step: 画像生成処理 ──
                    await sendEvent('step', { step: 1, total: 2, message: '画像生成処理中...' });

                    result = await segmind.seedreamGenerate({
                        prompt: seedreamPrompt,
                        image_input: imageInputUrls.length > 0 ? imageInputUrls : undefined,
                        width,
                        height,
                        aspect_ratio: imageInputUrls.length > 0 ? 'match_input_image' : seedreamAspect,
                    });

                    if (!result.image) {
                        await sendEvent('error', { error: '画像の生成に失敗しました。' });
                        await writer.close();
                        return;
                    }

                    await sendEvent('step', { step: 2, total: 2, message: '結果を保存中...' });
                    break;
                }

                case 'generate':
                    if (!prompt && !customPrompt) {
                        await sendEvent('error', { error: 'prompt is required for image generation' });
                        await writer.close();
                        return;
                    }
                    {
                        let width = 2048;
                        let height = 2048;
                        let seedreamAspect = '1:1';
                        if (aspectRatio === '4:5') {
                            seedreamAspect = '4:5';
                            width = 1640;
                            height = 2048;
                        } else if (aspectRatio === '9:16') {
                            seedreamAspect = '9:16';
                            width = 1152;
                            height = 2048;
                        }

                        await sendEvent('step', { step: 1, total: 1, message: '画像を生成中...' });
                        result = await segmind.seedreamGenerate({
                            prompt: (prompt || customPrompt).trim(),
                            width,
                            height,
                            aspect_ratio: seedreamAspect,
                        });
                    }
                    break;

                case 'faceswap':
                    if (!sourceImage || !targetImage) {
                        await sendEvent('error', { error: 'sourceImage and targetImage are required for face swap' });
                        await writer.close();
                        return;
                    }
                    {
                        await sendEvent('step', { step: 1, total: 2, message: '画像をアップロード中...' });
                        // If an image is already a URL (not base64 data URI), use it directly
                        const faceSourceUrl = sourceImage.startsWith('data:')
                            ? await uploadImageToStorage(sourceImage, 'faceswap-source')
                            : sourceImage;
                        const faceTargetUrl = targetImage.startsWith('data:')
                            ? await uploadImageToStorage(targetImage, 'faceswap-target')
                            : targetImage;

                        await sendEvent('step', { step: 2, total: 2, message: 'フェイススワップ処理中...' });
                        result = await segmind.faceSwap({
                            source_image: faceSourceUrl,
                            target_image: faceTargetUrl,
                        });
                    }
                    break;

                default:
                    await sendEvent('error', { error: 'Invalid mode. Use: seedream, generate, or faceswap' });
                    await writer.close();
                    return;
            }

            // Upload the final generated image to Supabase Storage
            await sendEvent('step', { step: -1, total: -1, message: '結果を保存中...' });

            let generatedImageUrl = result.image;
            try {
                if (result.image && result.image.startsWith('data:')) {
                    generatedImageUrl = await uploadImageToStorage(result.image, 'generated');
                }
            } catch (uploadErr) {
                console.error('Failed to upload generated image to storage:', uploadErr);
            }

            // Save generation to database using admin client to bypass RLS.
            // The user's identity was already verified via auth.getUser() above.
            // Using the cookie-based client here would fail because the SSE
            // streaming context can outlive the original request cookies.
            const { data: generation, error: dbError } = await adminClient
                .from('generations')
                .insert({
                    user_id: user.id,
                    campaign_id: campaignId || null,
                    ai_model_id: modelData?.id || null,
                    original_image_url: (productInputs?.[0]?.imageUrl) || outfitImage || modelImage || clothImage || sourceImage || null,
                    generated_image_url: generatedImageUrl,
                    model_type: mode,
                    background: background || null,
                    aspect_ratio: aspectRatio || '1:1',
                    status: 'completed',
                })
                .select()
                .single();

            if (dbError) {
                console.error('Database error:', dbError);
            }

            // Send the final result
            await sendEvent('complete', {
                success: true,
                image: result.image,
                imageUrl: generatedImageUrl,
                generation: generation || null,
            });

        } catch (error) {
            console.error('Generation error:', error);
            await sendEvent('error', {
                error: error instanceof Error ? error.message : 'Generation failed',
            });
        } finally {
            await writer.close();
        }
    })();

    return new Response(stream.readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
