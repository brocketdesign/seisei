import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdminRequest } from '@/utils/admin-auth';
import { getAdminClient } from '@/utils/storage';

/**
 * GET /api/v1/admin/stats
 *
 * Returns platform-wide statistics. Requires admin role.
 *
 * Response:
 *  - users: total, by plan, recently active, new this month
 *  - generations: total images, total videos, by status, this month
 *  - campaigns: total, by status
 *  - models: total AI models
 *  - api_keys: total issued
 */
export async function GET(request: NextRequest) {
    const auth = await authenticateAdminRequest(request);
    if ('error' in auth) return auth.error;

    try {
        const admin = getAdminClient();
        const now = new Date();
        const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // Run all queries in parallel
        const [
            totalUsersRes,
            usersThisMonthRes,
            planBreakdownRes,
            totalImagesRes,
            completedImagesRes,
            failedImagesRes,
            imagesThisMonthRes,
            totalVideosRes,
            completedVideosRes,
            failedVideosRes,
            videosThisMonthRes,
            totalCampaignsRes,
            activeCampaignsRes,
            totalProductsRes,
            totalModelsRes,
            totalApiKeysRes,
            recentlyActiveKeysRes,
            activeUsersLast7dRes,
            activeUsersLast30dRes,
        ] = await Promise.all([
            // Users
            admin.from('profiles').select('*', { count: 'exact', head: true }),
            admin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
            admin.from('profiles').select('plan'),

            // Image generations
            admin.from('generations').select('*', { count: 'exact', head: true }),
            admin.from('generations').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
            admin.from('generations').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
            admin.from('generations').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),

            // Video generations
            admin.from('video_generations').select('*', { count: 'exact', head: true }),
            admin.from('video_generations').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
            admin.from('video_generations').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
            admin.from('video_generations').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),

            // Campaigns
            admin.from('campaigns').select('*', { count: 'exact', head: true }),
            admin.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'active'),

            // Products
            admin.from('products').select('*', { count: 'exact', head: true }),

            // Models
            admin.from('ai_models').select('*', { count: 'exact', head: true }),

            // API keys
            admin.from('api_keys').select('*', { count: 'exact', head: true }),
            admin.from('api_keys').select('*', { count: 'exact', head: true }).gte('last_used_at', last30Days),

            // Active users (users who generated content recently)
            admin.from('generations').select('user_id').gte('created_at', last7Days),
            admin.from('generations').select('user_id').gte('created_at', last30Days),
        ]);

        // Compute plan breakdown
        const planCounts: Record<string, number> = {};
        if (planBreakdownRes.data) {
            for (const row of planBreakdownRes.data) {
                const plan = row.plan || 'free';
                planCounts[plan] = (planCounts[plan] || 0) + 1;
            }
        }

        // Count premium users (pro, business, enterprise)
        const premiumPlans = ['pro', 'business', 'enterprise'];
        const premiumUsers = Object.entries(planCounts)
            .filter(([plan]) => premiumPlans.includes(plan))
            .reduce((sum, [, count]) => sum + count, 0);

        // Count unique active users
        const uniqueActive7d = new Set(activeUsersLast7dRes.data?.map(r => r.user_id) ?? []).size;
        const uniqueActive30d = new Set(activeUsersLast30dRes.data?.map(r => r.user_id) ?? []).size;

        return NextResponse.json({
            generated_at: new Date().toISOString(),
            users: {
                total: totalUsersRes.count ?? 0,
                new_this_month: usersThisMonthRes.count ?? 0,
                premium: premiumUsers,
                by_plan: planCounts,
                active_last_7_days: uniqueActive7d,
                active_last_30_days: uniqueActive30d,
            },
            images: {
                total: totalImagesRes.count ?? 0,
                completed: completedImagesRes.count ?? 0,
                failed: failedImagesRes.count ?? 0,
                this_month: imagesThisMonthRes.count ?? 0,
            },
            videos: {
                total: totalVideosRes.count ?? 0,
                completed: completedVideosRes.count ?? 0,
                failed: failedVideosRes.count ?? 0,
                this_month: videosThisMonthRes.count ?? 0,
            },
            campaigns: {
                total: totalCampaignsRes.count ?? 0,
                active: activeCampaignsRes.count ?? 0,
            },
            products: {
                total: totalProductsRes.count ?? 0,
            },
            ai_models: {
                total: totalModelsRes.count ?? 0,
            },
            api_keys: {
                total: totalApiKeysRes.count ?? 0,
                active_last_30_days: recentlyActiveKeysRes.count ?? 0,
            },
        });
    } catch (error) {
        console.error('[api/v1/admin/stats] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch admin stats' },
            { status: 500 },
        );
    }
}
