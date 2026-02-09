import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/utils/api-auth';
import { getAdminClient } from '@/utils/storage';

/**
 * GET /api/v1/campaigns/[id]
 *
 * Get a single campaign by ID, including its products and generation count.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const auth = await authenticateApiRequest(request);
    if ('error' in auth) return auth.error;

    const { userId } = auth.user;

    try {
        const { id } = await params;
        const adminClient = getAdminClient();

        // Fetch campaign
        const { data: campaign, error: campaignError } = await adminClient
            .from('campaigns')
            .select('id, name, description, status, start_date, end_date, created_at, updated_at')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (campaignError || !campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // Fetch products for this campaign
        const { data: products } = await adminClient
            .from('products')
            .select('id, name, description, image_url, category, tags, is_active')
            .eq('campaign_id', id)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        // Count generations for this campaign
        const { count: generationCount } = await adminClient
            .from('generations')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', id)
            .eq('user_id', userId);

        return NextResponse.json({
            campaign: {
                ...campaign,
                products: products || [],
                generation_count: generationCount ?? 0,
            },
        });
    } catch (error) {
        console.error('[api/v1/campaigns/[id]] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch campaign' },
            { status: 500 },
        );
    }
}
