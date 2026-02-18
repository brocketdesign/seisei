import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/utils/api-auth';
import { createSegmindClient } from '@/utils/segmind';
import { uploadImageToStorage, getAdminClient } from '@/utils/storage';
import { canGenerateImage } from '@/utils/plan-limits';

export const maxDuration = 120;

/**
 * GET /api/v1/products
 *
 * List all products for the authenticated user.
 *
 * Query params:
 *  - campaignId (string, optional): Filter by campaign UUID
 *  - limit  (number, optional): Max results (default: 50)
 *  - offset (number, optional): Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
    const auth = await authenticateApiRequest(request);
    if ('error' in auth) return auth.error;

    const { userId } = auth.user;

    try {
        const { searchParams } = new URL(request.url);
        const campaignId = searchParams.get('campaignId');
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        const adminClient = getAdminClient();

        let query = adminClient
            .from('products')
            .select('id, name, description, image_url, category, tags, campaign_id, is_active, created_at, updated_at', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (campaignId) {
            query = query.eq('campaign_id', campaignId);
        }

        const { data: products, count, error } = await query;

        if (error) {
            console.error('[api/v1/products] DB error:', error);
            return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
        }

        return NextResponse.json({
            products: products || [],
            total: count ?? 0,
        });
    } catch (error) {
        console.error('[api/v1/products] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch products' },
            { status: 500 },
        );
    }
}

/**
 * POST /api/v1/products
 *
 * Create a new product. Two modes:
 *  1. Generate mode: provide `prompt` to AI-generate the product image
 *  2. Upload mode: provide `imageData` (base64 data URI) to upload your own image
 *
 * Body:
 *  - name         (string, required): Product name
 *  - prompt       (string, optional): AI prompt to generate the product image (generate mode)
 *  - imageData    (string, optional): Base64 data URI of the product image (upload mode)
 *  - campaignId   (string, optional): UUID of existing campaign
 *  - campaignName (string, optional): Name of campaign — created automatically if it doesn't exist
 *  - description  (string, optional): Product description
 *  - category     (string, optional): Product category
 *  - productType  (string, optional): 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'accessory' (default: 'top')
 *  - tags         (string[], optional): Product tags
 */
export async function POST(request: NextRequest) {
    const auth = await authenticateApiRequest(request);
    if ('error' in auth) return auth.error;

    const { userId, plan } = auth.user;

    try {
        const adminClient = getAdminClient();

        const body = await request.json();
        const { name, prompt, imageData, campaignId, campaignName, description, category, tags, productType } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: 'name is required.' }, { status: 400 });
        }

        const isGenerateMode = !!prompt;

        if (!isGenerateMode && !imageData) {
            return NextResponse.json(
                { error: 'Either prompt (to generate) or imageData (base64 data URI to upload) is required.' },
                { status: 400 },
            );
        }

        // Check quota only when generating (upload doesn't consume generation credits)
        if (isGenerateMode) {
            const allowed = await canGenerateImage(adminClient, userId, plan);
            if (!allowed) {
                return NextResponse.json(
                    { error: 'Monthly image generation limit reached. Please upgrade your plan.' },
                    { status: 429 },
                );
            }
        }

        // Resolve campaign — use campaignId, or find/create by campaignName
        let resolvedCampaignId: string | null = campaignId || null;

        if (!resolvedCampaignId && campaignName) {
            // Try to find existing campaign by name
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
                // Create new campaign
                const { data: newCampaign, error: campError } = await adminClient
                    .from('campaigns')
                    .insert({
                        user_id: userId,
                        name: campaignName,
                        status: 'active',
                    })
                    .select('id')
                    .single();

                if (campError) {
                    console.error('Campaign creation failed:', campError);
                    return NextResponse.json({ error: 'Failed to create campaign.' }, { status: 500 });
                }
                resolvedCampaignId = newCampaign.id;
            }
        }

        let imageUrl: string;

        if (isGenerateMode) {
            // Generate product image via Seedream 4.5
            const segmind = createSegmindClient();
            const imageResult = await segmind.seedreamGenerate({
                prompt: `Professional flat-lay product photography of a ${prompt.trim()}. Clean white background, no person, no mannequin, high quality studio lighting, 8K resolution.`,
                width: 2048,
                height: 2048,
                aspect_ratio: '1:1',
            });

            if (!imageResult.image) {
                return NextResponse.json({ error: 'Failed to generate product image.' }, { status: 500 });
            }

            imageUrl = await uploadImageToStorage(imageResult.image, 'products');
        } else {
            // Upload mode — upload provided image to storage
            try {
                imageUrl = await uploadImageToStorage(imageData, 'products');
            } catch (uploadErr) {
                console.error('Product image upload failed:', uploadErr);
                return NextResponse.json({ error: 'Image upload failed.' }, { status: 500 });
            }
        }

        // Insert into products table
        const { data: product, error: dbError } = await adminClient
            .from('products')
            .insert({
                user_id: userId,
                campaign_id: resolvedCampaignId,
                name: name.trim(),
                description: description || null,
                image_url: imageUrl,
                category: category || null,
                product_type: productType || 'top',
                tags: tags || [],
                is_active: true,
            })
            .select('id, name, description, image_url, category, product_type, tags, campaign_id, is_active, created_at')
            .single();

        if (dbError) {
            console.error('Product insert error:', dbError);
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            product,
            campaign_id: resolvedCampaignId,
        });
    } catch (error) {
        console.error('[api/v1/products] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Product creation failed' },
            { status: 500 },
        );
    }
}
