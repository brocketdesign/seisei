import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/utils/api-auth';
import { createSegmindClient } from '@/utils/segmind';
import { uploadImageToStorage, getAdminClient } from '@/utils/storage';
import { canGenerateImage } from '@/utils/plan-limits';

export const maxDuration = 120;

/**
 * POST /api/v1/generate/faceswap
 *
 * Face swap: takes a source face image and a target image,
 * swaps the face from source onto the target.
 *
 * Body:
 *  - sourceImage       (string, required): Base64 data URI or URL of the face to use
 *  - targetImage       (string, required): Base64 data URI or URL of the target image
 *  - campaignId        (string, optional): UUID of the campaign to associate
 *  - preserveLighting  (boolean, optional): Hint for lighting preservation (default: true)
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
        const { sourceImage, targetImage, campaignId } = body;

        if (!sourceImage) {
            return NextResponse.json(
                { error: 'sourceImage is required (base64 data URI or URL).' },
                { status: 400 },
            );
        }
        if (!targetImage) {
            return NextResponse.json(
                { error: 'targetImage is required (base64 data URI or URL).' },
                { status: 400 },
            );
        }

        const startTime = Date.now();

        // Upload images to get public URLs (Segmind faceswap requires URLs)
        const sourceUrl = sourceImage.startsWith('data:')
            ? await uploadImageToStorage(sourceImage, 'faceswap-source')
            : sourceImage;
        const targetUrl = targetImage.startsWith('data:')
            ? await uploadImageToStorage(targetImage, 'faceswap-target')
            : targetImage;

        // Run face swap via Segmind Faceswap v5
        const segmind = createSegmindClient();
        const result = await segmind.faceSwap({
            source_image: sourceUrl,
            target_image: targetUrl,
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
                original_image_url: targetUrl,
                generated_image_url: generatedImageUrl,
                model_type: 'faceswap',
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
        console.error('[api/v1/generate/faceswap] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Face swap generation failed' },
            { status: 500 },
        );
    }
}
