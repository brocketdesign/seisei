import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/utils/api-auth';
import { getAdminClient } from '@/utils/storage';

/**
 * GET /api/v1/generations
 *
 * Retrieve generated media (images and videos) for the authenticated user.
 *
 * Query params:
 *  - type        (string, optional): 'images' | 'videos' (default: 'images')
 *  - model_id    (string, optional): Filter by AI model ID
 *  - campaign_id (string, optional): Filter by campaign ID
 *  - status      (string, optional): Filter by status ('pending' | 'processing' | 'completed' | 'failed')
 *  - date_from   (string, optional): ISO 8601 date — only results created on or after this date
 *  - date_to     (string, optional): ISO 8601 date — only results created on or before this date
 *  - limit       (number, optional): Max results (default: 50, max: 100)
 *  - offset      (number, optional): Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
    const auth = await authenticateApiRequest(request);
    if ('error' in auth) return auth.error;

    const { userId } = auth.user;

    try {
        const { searchParams } = new URL(request.url);

        const type = searchParams.get('type') || 'images';
        const modelId = searchParams.get('model_id');
        const campaignId = searchParams.get('campaign_id');
        const status = searchParams.get('status');
        const dateFrom = searchParams.get('date_from');
        const dateTo = searchParams.get('date_to');
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        if (type !== 'images' && type !== 'videos') {
            return NextResponse.json(
                { error: "Invalid type. Must be 'images' or 'videos'." },
                { status: 400 },
            );
        }

        const validStatuses = ['pending', 'processing', 'completed', 'failed'];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                { status: 400 },
            );
        }

        const adminClient = getAdminClient();

        const table = type === 'images' ? 'generations' : 'video_generations';
        const selectFields = type === 'images'
            ? 'id, generated_image_url, original_image_url, model_type, background, aspect_ratio, status, ai_model_id, campaign_id, created_at'
            : 'id, source_image_url, video_url, prompt, template, duration, status, ai_model_id, campaign_id, generation_id, created_at';

        let query = adminClient
            .from(table)
            .select(selectFields, { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (modelId) query = query.eq('ai_model_id', modelId);
        if (campaignId) query = query.eq('campaign_id', campaignId);
        if (status) query = query.eq('status', status);
        if (dateFrom) query = query.gte('created_at', dateFrom);
        if (dateTo) query = query.lte('created_at', dateTo);

        const { data: generations, count, error } = await query;

        if (error) {
            console.error('[api/v1/generations] DB error:', error);
            return NextResponse.json({ error: 'Failed to fetch generations' }, { status: 500 });
        }

        return NextResponse.json({
            type,
            generations: generations || [],
            total: count ?? 0,
        });
    } catch (error) {
        console.error('[api/v1/generations] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch generations' },
            { status: 500 },
        );
    }
}
