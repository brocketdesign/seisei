import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/utils/api-auth';
import { getAdminClient } from '@/utils/storage';

/**
 * GET /api/v1/campaigns
 *
 * List all campaigns for the authenticated user.
 *
 * Query params:
 *  - status (string, optional): Filter by status ('draft' | 'active' | 'scheduled' | 'completed')
 *  - limit  (number, optional): Max results (default: 50)
 *  - offset (number, optional): Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
    const auth = await authenticateApiRequest(request);
    if ('error' in auth) return auth.error;

    const { userId } = auth.user;

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        const adminClient = getAdminClient();

        let query = adminClient
            .from('campaigns')
            .select('id, name, description, status, start_date, end_date, created_at, updated_at', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq('status', status);
        }

        const { data: campaigns, count, error } = await query;

        if (error) {
            console.error('[api/v1/campaigns] DB error:', error);
            return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
        }

        return NextResponse.json({
            campaigns: campaigns || [],
            total: count ?? 0,
        });
    } catch (error) {
        console.error('[api/v1/campaigns] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch campaigns' },
            { status: 500 },
        );
    }
}

/**
 * POST /api/v1/campaigns
 *
 * Create a new campaign — coming soon.
 */
export async function POST(request: NextRequest) {
    const auth = await authenticateApiRequest(request);
    if ('error' in auth) return auth.error;

    return NextResponse.json(
        {
            error: 'Campaign creation via API is coming soon.',
            status: 'coming_soon',
        },
        { status: 501 },
    );
}
