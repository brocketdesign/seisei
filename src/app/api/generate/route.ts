import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createSegmindClient } from '@/utils/segmind';

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            mode, // 'tryon' | 'generate' | 'faceswap'
            modelImage,
            clothImage,
            sourceImage,
            targetImage,
            prompt,
            category,
            aspectRatio,
            campaignId,
        } = body;

        const segmind = createSegmindClient();
        let result;

        switch (mode) {
            case 'tryon':
                if (!modelImage || !clothImage) {
                    return NextResponse.json(
                        { error: 'modelImage and clothImage are required for try-on' },
                        { status: 400 }
                    );
                }
                result = await segmind.virtualTryOn({
                    model_image: modelImage,
                    cloth_image: clothImage,
                    category: category || 'Upper-body',
                });
                break;

            case 'generate':
                if (!prompt) {
                    return NextResponse.json(
                        { error: 'prompt is required for image generation' },
                        { status: 400 }
                    );
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

                result = await segmind.generateImage({
                    prompt,
                    width,
                    height,
                });
                break;

            case 'faceswap':
                if (!sourceImage || !targetImage) {
                    return NextResponse.json(
                        { error: 'sourceImage and targetImage are required for face swap' },
                        { status: 400 }
                    );
                }
                result = await segmind.faceSwap({
                    source_image: sourceImage,
                    target_image: targetImage,
                });
                break;

            default:
                return NextResponse.json(
                    { error: 'Invalid mode. Use: tryon, generate, or faceswap' },
                    { status: 400 }
                );
        }

        // Save generation to database
        const { data: generation, error: dbError } = await supabase
            .from('generations')
            .insert({
                user_id: user.id,
                campaign_id: campaignId || null,
                original_image_url: modelImage || clothImage || sourceImage || null,
                generated_image_url: result.image,
                model_type: mode,
                aspect_ratio: aspectRatio || '1:1',
                status: 'completed',
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database error:', dbError);
            // Still return the image even if DB save fails
        }

        return NextResponse.json({
            success: true,
            image: result.image,
            generation: generation || null,
        });

    } catch (error) {
        console.error('Generation error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Generation failed' },
            { status: 500 }
        );
    }
}
