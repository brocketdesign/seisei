import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/utils/api-auth';
import { getAdminClient, uploadImageToStorage } from '@/utils/storage';

/**
 * GET /api/v1/models
 *
 * List all AI models for the authenticated user.
 *
 * Query params:
 *  - limit  (number, optional): Max results (default: 50)
 *  - offset (number, optional): Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
    const auth = await authenticateApiRequest(request);
    if ('error' in auth) return auth.error;

    const { userId } = auth.user;

    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        const adminClient = getAdminClient();

        const { data: models, count, error } = await adminClient
            .from('ai_models')
            .select('id, name, thumbnail_url, type, model_data, created_at', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('[api/v1/models] DB error:', error);
            return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
        }

        return NextResponse.json({
            models: models || [],
            total: count ?? 0,
        });
    } catch (error) {
        console.error('[api/v1/models] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch models' },
            { status: 500 },
        );
    }
}

/**
 * POST /api/v1/models
 *
 * Create a new AI model.
 *
 * Body:
 *  - name          (string, required): Model name
 *  - thumbnailData (string, required): Base64 data URI of the face image
 *  - type          (string, optional): 'uploaded' | 'ai-generated' (default: 'uploaded')
 *  - modelData     (object, optional): { bodyType, tags, age, ethnicity, sex, isActive }
 */
export async function POST(request: NextRequest) {
    const auth = await authenticateApiRequest(request);
    if ('error' in auth) return auth.error;

    const { userId } = auth.user;

    try {
        const body = await request.json();
        const { name, type, thumbnailData, modelData } = body;

        if (!name || !name.trim()) {
            return NextResponse.json(
                { error: 'name is required.' },
                { status: 400 },
            );
        }

        if (!thumbnailData) {
            return NextResponse.json(
                { error: 'thumbnailData is required (base64 data URI of the face image).' },
                { status: 400 },
            );
        }

        // Upload the thumbnail to storage
        let thumbnailUrl: string;
        try {
            thumbnailUrl = await uploadImageToStorage(thumbnailData, `models/${userId}`);
        } catch (uploadErr) {
            console.error('Thumbnail upload failed:', uploadErr);
            return NextResponse.json({ error: 'Image upload failed.' }, { status: 500 });
        }

        // Insert into ai_models
        const adminClient = getAdminClient();
        const { data: inserted, error: dbError } = await adminClient
            .from('ai_models')
            .insert({
                user_id: userId,
                name: name.trim(),
                type: type || 'uploaded',
                thumbnail_url: thumbnailUrl,
                model_data: modelData || {},
            })
            .select('id, name, thumbnail_url, type, model_data')
            .single();

        if (dbError) {
            console.error('DB insert error:', dbError);
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }

        return NextResponse.json({ model: inserted });
    } catch (error) {
        console.error('[api/v1/models] Error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Internal server error',
        }, { status: 500 });
    }
}
