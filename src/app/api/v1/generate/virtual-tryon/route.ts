import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/utils/api-auth';
import { createSegmindClient } from '@/utils/segmind';
import { uploadImageToStorage, getAdminClient } from '@/utils/storage';
import { canGenerateImage } from '@/utils/plan-limits';

export const maxDuration = 120;

/**
 * POST /api/v1/generate/virtual-tryon
 *
 * Virtual try-on: takes a product/outfit image and a model image,
 * generates the model wearing the outfit using Seedream 4.5.
 *
 * Body:
 *  - outfitImage (string, required): Base64 data URI or public URL of the outfit/garment image
 *  - modelImage  (string, required): Base64 data URI or public URL of the model image
 *  - prompt      (string, optional): Custom prompt for the generation
 *  - productType (string, optional): 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'accessory'
 *  - campaignId  (string, optional): UUID of the campaign to associate
 *  - aspectRatio (string, optional): '1:1' | '4:5' | '9:16'
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
        const { outfitImage, modelImage, prompt, productType, campaignId, aspectRatio } = body;

        if (!outfitImage) {
            return NextResponse.json(
                { error: 'outfitImage is required (base64 data URI or public URL).' },
                { status: 400 },
            );
        }
        if (!modelImage) {
            return NextResponse.json(
                { error: 'modelImage is required (base64 data URI or public URL).' },
                { status: 400 },
            );
        }

        const startTime = Date.now();

        // Upload images to get public URLs if needed
        const outfitUrl = outfitImage.startsWith('data:')
            ? await uploadImageToStorage(outfitImage, 'outfits')
            : outfitImage;
        const modelUrl = modelImage.startsWith('data:')
            ? await uploadImageToStorage(modelImage, 'models')
            : modelImage;

        // Build prompt for Seedream
        const typeLabel = productType === 'bottom' ? 'bottom garment'
            : productType === 'dress' ? 'dress/one-piece'
            : productType === 'outerwear' ? 'outerwear/jacket'
            : productType === 'shoes' ? 'shoes/footwear'
            : productType === 'accessory' ? 'accessory'
            : 'top garment';

        const seedreamPrompt = prompt
            || `Create a professional fashion brand photoshoot of the reference model wearing the reference ${typeLabel}, striking confident model poses against a clean white photography studio background with professional lighting. Photorealistic, high quality fashion photography, 8K resolution, sharp focus.`;

        // Run generation via Seedream 4.5
        const segmind = createSegmindClient();
        const result = await segmind.seedreamGenerate({
            prompt: seedreamPrompt,
            image_input: [modelUrl, outfitUrl],
            width: 2048,
            height: 2048,
            aspect_ratio: 'match_input_image',
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
                original_image_url: outfitUrl,
                generated_image_url: generatedImageUrl,
                model_type: 'tryon',
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
        console.error('[api/v1/generate/virtual-tryon] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Virtual try-on generation failed' },
            { status: 500 },
        );
    }
}
