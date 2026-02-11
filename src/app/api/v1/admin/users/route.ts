import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdminRequest } from '@/utils/admin-auth';
import { getAdminClient } from '@/utils/storage';

/**
 * GET /api/v1/admin/users
 *
 * List all users with their usage details. Requires admin role.
 *
 * Query params:
 *  - plan       (string, optional): Filter by plan (free, starter, pro, business, enterprise)
 *  - search     (string, optional): Search by email or brand_name
 *  - sort       (string, optional): Sort field — 'created_at' | 'email' | 'plan' (default: created_at)
 *  - order      (string, optional): 'asc' | 'desc' (default: desc)
 *  - limit      (number, optional): Max results (default: 50, max: 100)
 *  - offset     (number, optional): Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
    const auth = await authenticateAdminRequest(request);
    if ('error' in auth) return auth.error;

    try {
        const { searchParams } = new URL(request.url);

        const plan = searchParams.get('plan');
        const search = searchParams.get('search');
        const sort = searchParams.get('sort') || 'created_at';
        const order = searchParams.get('order') || 'desc';
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        const validSortFields = ['created_at', 'email', 'plan'];
        if (!validSortFields.includes(sort)) {
            return NextResponse.json(
                { error: `Invalid sort field. Must be one of: ${validSortFields.join(', ')}` },
                { status: 400 },
            );
        }

        const admin = getAdminClient();

        // Build the query
        let query = admin
            .from('profiles')
            .select('id, email, brand_name, plan, billing_interval, role, created_at, updated_at', { count: 'exact' })
            .order(sort, { ascending: order === 'asc' })
            .range(offset, offset + limit - 1);

        if (plan) query = query.eq('plan', plan);
        if (search) query = query.or(`email.ilike.%${search}%,brand_name.ilike.%${search}%`);

        const { data: users, count, error } = await query;

        if (error) {
            console.error('[api/v1/admin/users] DB error:', error);
            return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
        }

        if (!users || users.length === 0) {
            return NextResponse.json({ users: [], total: 0 });
        }

        // Get generation counts per user in this batch
        const userIds = users.map(u => u.id);

        const now = new Date();
        const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

        // Fetch counts for all users in this page
        const [imageCountsRes, videoCountsRes, imageCountsMonthRes, videoCountsMonthRes] = await Promise.all([
            admin.from('generations').select('user_id').in('user_id', userIds),
            admin.from('video_generations').select('user_id').in('user_id', userIds),
            admin.from('generations').select('user_id').in('user_id', userIds).gte('created_at', monthStart),
            admin.from('video_generations').select('user_id').in('user_id', userIds).gte('created_at', monthStart),
        ]);

        // Aggregate counts per user
        const countByUser = (rows: { user_id: string }[] | null) => {
            const map: Record<string, number> = {};
            if (rows) {
                for (const row of rows) {
                    map[row.user_id] = (map[row.user_id] || 0) + 1;
                }
            }
            return map;
        };

        const totalImages = countByUser(imageCountsRes.data);
        const totalVideos = countByUser(videoCountsRes.data);
        const monthImages = countByUser(imageCountsMonthRes.data);
        const monthVideos = countByUser(videoCountsMonthRes.data);

        const enrichedUsers = users.map(user => ({
            id: user.id,
            email: user.email,
            brand_name: user.brand_name,
            plan: user.plan || 'free',
            billing_interval: user.billing_interval,
            role: user.role,
            created_at: user.created_at,
            updated_at: user.updated_at,
            usage: {
                images_total: totalImages[user.id] || 0,
                videos_total: totalVideos[user.id] || 0,
                images_this_month: monthImages[user.id] || 0,
                videos_this_month: monthVideos[user.id] || 0,
            },
        }));

        return NextResponse.json({
            users: enrichedUsers,
            total: count ?? 0,
            limit,
            offset,
        });
    } catch (error) {
        console.error('[api/v1/admin/users] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch users' },
            { status: 500 },
        );
    }
}
