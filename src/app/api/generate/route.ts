import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createSegmindClient } from '@/utils/segmind';
import { buildModelPrompt, type AIModel } from '@/types/models';
import { uploadImageToStorage } from '@/utils/storage';
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
            // Check authentication
            const supabase = await createClient();
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                await sendEvent('error', { error: 'Unauthorized' });
                await writer.close();
                return;
            }

            // Check image generation quota
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: profile } = await (supabase as any)
                .from('profiles')
                .select('plan')
                .eq('id', user.id)
                .single();
            const userPlan = profile?.plan || 'starter';
            const allowed = await canGenerateImage(supabase, user.id, userPlan);
            if (!allowed) {
                await sendEvent('error', { error: '今月の画像生成上限に達しました。プランをアップグレードしてください。' });
                await writer.close();
                return;
            }

            const body = await request.json();
            const {
                mode, // 'tryon' | 'generate' | 'faceswap' | 'full-pipeline'
                outfitImage,   // base64 data URI of uploaded outfit/garment
                modelImage,
                clothImage,    // legacy alias for outfitImage
                sourceImage,
                targetImage,
                prompt,
                aspectRatio,
                campaignId,
                background,
                modelData,     // model roster data { id, name, age, ethnicity, bodyType, tags, avatar }
            } = body;

            const segmind = createSegmindClient();
            let result;

            switch (mode) {
                case 'full-pipeline': {
                    // ============================================================
                    // 4-Step Pipeline:
                    //   1. Generate model image (Z-Image Turbo)
                    //   2. Upload model image → get URL
                    //   3. Face swap reference face onto generated model (Faceswap v5)
                    //   4. Virtual try-on outfit onto face-swapped model (SegFit v1.3)
                    // ============================================================

                    if (!outfitImage) {
                        await sendEvent('error', { error: 'outfitImage is required for full-pipeline mode' });
                        await writer.close();
                        return;
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

                    // Build a prompt for the model image based on roster data
                    const bgMap: Record<string, string> = {
                        'スタジオ（白背景）': 'in a clean white photography studio with professional lighting',
                        'ストリート（昼）': 'on a bright urban street during daytime with natural sunlight',
                        'カフェ（屋内）': 'in a cozy indoor café with warm ambient lighting',
                        '自然光': 'in natural daylight with soft diffused lighting',
                    };

                    const bgPrompt = bgMap[background || 'スタジオ（白背景）'] || bgMap['スタジオ（白背景）'];

                    // Use model roster attributes to build a specific prompt
                    let stylePrompt: string;
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
                        stylePrompt = buildModelPrompt(rosterModel);
                    } else {
                        stylePrompt = 'a Japanese fashion model with natural makeup, elegant pose, slim build';
                    }

                    const modelPrompt = `Full-body professional fashion photograph of ${stylePrompt}, standing ${bgPrompt}. Photorealistic, high quality fashion photography, 8k resolution, sharp focus, professional studio lighting.`;

                    // ── Step 1: Generate model image ──
                    await sendEvent('step', { step: 1, total: 4, message: 'AIモデル画像を生成中...' });

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
                        await sendEvent('error', { error: 'Failed to generate model image' });
                        await writer.close();
                        return;
                    }

                    // ── Step 2: Upload images to get URLs ──
                    await sendEvent('step', { step: 2, total: 4, message: '画像をアップロード中...' });

                    const [outfitUrl, generatedModelUrl] = await Promise.all([
                        uploadImageToStorage(outfitImage, 'outfits'),
                        uploadImageToStorage(modelResult.image!, 'models'),
                    ]);

                    // ── Step 3: Face swap for consistency ──
                    // Use the model's avatar as the source face (reference face)
                    // and swap it onto the generated model image
                    // The avatar URL is already a public Supabase Storage URL
                    const modelAvatarUrl = modelData?.avatar;

                    let faceSwappedModelUrl = generatedModelUrl;

                    if (modelAvatarUrl) {
                        await sendEvent('step', { step: 3, total: 4, message: 'フェイススワップ処理中...' });

                        try {
                            // source_image = the reference face (model avatar, already a public URL)
                            // target_image = the generated model image (already a public URL)
                            const faceSwapResult = await segmind.faceSwap({
                                source_image: modelAvatarUrl,
                                target_image: generatedModelUrl,
                                image_format: 'png',
                                quality: 95,
                            });

                            if (faceSwapResult.image) {
                                // Upload face-swapped image to get a URL
                                faceSwappedModelUrl = await uploadImageToStorage(faceSwapResult.image, 'faceswapped');
                            }
                        } catch (faceSwapErr) {
                            console.error('Face swap failed, proceeding without it:', faceSwapErr);
                            // Continue with the original generated model if face swap fails
                        }
                    } else {
                        await sendEvent('step', { step: 3, total: 4, message: 'フェイススワップをスキップ（参照画像なし）' });
                    }

                    // ── Step 4: Virtual try-on (SegFit) ──
                    await sendEvent('step', { step: 4, total: 4, message: '衣装を合成中...' });

                    result = await segmind.virtualTryOn({
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
                    break;
                }

                case 'tryon':
                    if (!modelImage || !(clothImage || outfitImage)) {
                        await sendEvent('error', { error: 'modelImage and outfitImage/clothImage are required for try-on' });
                        await writer.close();
                        return;
                    }
                    {
                        await sendEvent('step', { step: 1, total: 2, message: '画像をアップロード中...' });
                        const outfitSrc = outfitImage || clothImage;
                        const [tryonOutfitUrl, tryonModelUrl] = await Promise.all([
                            uploadImageToStorage(outfitSrc, 'outfits'),
                            uploadImageToStorage(modelImage, 'models'),
                        ]);
                        await sendEvent('step', { step: 2, total: 2, message: '衣装を合成中...' });
                        result = await segmind.virtualTryOn({
                            model_image: tryonModelUrl,
                            outfit_image: tryonOutfitUrl,
                        });
                    }
                    break;

                case 'generate':
                    if (!prompt) {
                        await sendEvent('error', { error: 'prompt is required for image generation' });
                        await writer.close();
                        return;
                    }
                    {
                        let width = 1024;
                        let height = 1024;
                        if (aspectRatio === '4:5') {
                            width = 896;
                            height = 1120;
                        } else if (aspectRatio === '9:16') {
                            width = 720;
                            height = 1280;
                        }

                        await sendEvent('step', { step: 1, total: 1, message: '画像を生成中...' });
                        result = await segmind.generateImage({
                            prompt,
                            width,
                            height,
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
                        const [faceSourceUrl, faceTargetUrl] = await Promise.all([
                            uploadImageToStorage(sourceImage, 'faceswap-source'),
                            uploadImageToStorage(targetImage, 'faceswap-target'),
                        ]);
                        await sendEvent('step', { step: 2, total: 2, message: 'フェイススワップ処理中...' });
                        result = await segmind.faceSwap({
                            source_image: faceSourceUrl,
                            target_image: faceTargetUrl,
                        });
                    }
                    break;

                default:
                    await sendEvent('error', { error: 'Invalid mode. Use: full-pipeline, tryon, generate, or faceswap' });
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

            // Save generation to database
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: generation, error: dbError } = await (supabase as any)
                .from('generations')
                .insert({
                    user_id: user.id,
                    campaign_id: campaignId || null,
                    ai_model_id: modelData?.id || null,
                    original_image_url: outfitImage || modelImage || clothImage || sourceImage || null,
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
