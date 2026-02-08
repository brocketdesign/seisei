import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createSegmindClient } from '@/utils/segmind';
import { uploadVideoToStorage } from '@/utils/storage';
import { canGenerateVideo } from '@/utils/plan-limits';

export const maxDuration = 300; // Allow up to 5 minutes for video generation

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check video generation quota
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase as any)
            .from('profiles')
            .select('plan')
            .eq('id', user.id)
            .single();
        const userPlan = profile?.plan || 'starter';
        const allowed = await canGenerateVideo(supabase, user.id, userPlan);
        if (!allowed) {
            return NextResponse.json(
                { error: '今月の動画生成上限に達しました。プランをアップグレードしてください。' },
                { status: 403 },
            );
        }

        const body = await request.json();
        const {
            sourceImageUrl,  // Public URL of the source image
            prompt,          // Animation prompt
            template,        // Template name (optional)
            duration,        // Duration in seconds (default 5)
            generationId,    // ID of the source generation (optional)
            aiModelId,       // ID of the AI model used (optional)
            campaignId,      // ID of the campaign (optional)
        } = body;

        if (!sourceImageUrl) {
            return NextResponse.json({ error: 'sourceImageUrl is required' }, { status: 400 });
        }

        if (!prompt) {
            return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
        }

        // Create a pending video generation record
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: videoGen, error: insertError } = await (supabase as any)
            .from('video_generations')
            .insert({
                user_id: user.id,
                generation_id: generationId || null,
                ai_model_id: aiModelId || null,
                campaign_id: campaignId || null,
                source_image_url: sourceImageUrl,
                prompt,
                template: template || null,
                duration: duration || 5,
                status: 'processing',
            })
            .select()
            .single();

        if (insertError) {
            console.error('Failed to create video generation record:', insertError);
            return NextResponse.json({ error: 'Failed to create video generation' }, { status: 500 });
        }

        // Call Kling O1 Image-to-Video API
        const segmind = createSegmindClient();

        try {
            const videoBuffer = await segmind.imageToVideo({
                prompt,
                start_image_url: sourceImageUrl,
                duration: duration || 5,
            });

            // Upload video to Supabase Storage
            const videoUrl = await uploadVideoToStorage(videoBuffer, 'videos', 'video/mp4');

            // Update the record with the video URL
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
                .from('video_generations')
                .update({
                    video_url: videoUrl,
                    status: 'completed',
                })
                .eq('id', videoGen.id);

            return NextResponse.json({
                success: true,
                videoGeneration: {
                    ...videoGen,
                    video_url: videoUrl,
                    status: 'completed',
                },
            });
        } catch (genError) {
            console.error('Video generation failed:', genError);

            // Update the record as failed
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
                .from('video_generations')
                .update({ status: 'failed' })
                .eq('id', videoGen.id);

            return NextResponse.json({
                error: genError instanceof Error ? genError.message : 'Video generation failed',
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Video generation error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Internal server error',
        }, { status: 500 });
    }
}

/**
 * GET: Fetch video generation history
 */
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: videos, error: dbError } = await (supabase as any)
            .from('video_generations')
            .select('id, source_image_url, video_url, prompt, template, duration, status, ai_model_id, generation_id, campaign_id, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (dbError) {
            console.error('Database error fetching video history:', dbError);
            return NextResponse.json({ error: 'Failed to load video history' }, { status: 500 });
        }

        return NextResponse.json({ videos: videos || [] });
    } catch (error) {
        console.error('Video history fetch error:', error);
        return NextResponse.json({ error: 'Failed to load video history' }, { status: 500 });
    }
}
