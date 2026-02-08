import { SupabaseClient } from '@supabase/supabase-js';
import { getPlanLimits, type PlanLimits } from './plans';

export interface UsageStatus {
    plan: string;
    limits: PlanLimits;
    used: { images: number; videos: number };
    remaining: { images: number; videos: number };
}

/**
 * Get the start of the current billing month (1st of the month, UTC).
 */
function getBillingPeriodStart(): string {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/**
 * Check usage for a user against their plan limits.
 * Returns usage status including remaining generations.
 */
export async function getUserUsage(
    supabase: SupabaseClient,
    userId: string,
    plan: string,
): Promise<UsageStatus> {
    const limits = getPlanLimits(plan);
    const periodStart = getBillingPeriodStart();

    // Count image generations this billing period
    const { count: imageCount } = await supabase
        .from('generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', periodStart);

    // Count video generations this billing period
    const { count: videoCount } = await supabase
        .from('video_generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', periodStart);

    const usedImages = imageCount ?? 0;
    const usedVideos = videoCount ?? 0;

    return {
        plan,
        limits,
        used: { images: usedImages, videos: usedVideos },
        remaining: {
            images: limits.images === -1 ? -1 : Math.max(0, limits.images - usedImages),
            videos: limits.videos === -1 ? -1 : Math.max(0, limits.videos - usedVideos),
        },
    };
}

/**
 * Check if a user can generate an image based on their plan limits.
 * Returns true if the user has remaining image quota, false otherwise.
 * Plans with -1 limits (enterprise) are always allowed.
 */
export async function canGenerateImage(
    supabase: SupabaseClient,
    userId: string,
    plan: string,
): Promise<boolean> {
    const limits = getPlanLimits(plan);
    if (limits.images === -1) return true;

    const periodStart = getBillingPeriodStart();
    const { count } = await supabase
        .from('generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', periodStart);

    return (count ?? 0) < limits.images;
}

/**
 * Check if a user can generate a video based on their plan limits.
 * Returns true if the user has remaining video quota, false otherwise.
 * Plans with -1 limits (enterprise) are always allowed.
 */
export async function canGenerateVideo(
    supabase: SupabaseClient,
    userId: string,
    plan: string,
): Promise<boolean> {
    const limits = getPlanLimits(plan);
    if (limits.videos === -1) return true;

    const periodStart = getBillingPeriodStart();
    const { count } = await supabase
        .from('video_generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', periodStart);

    return (count ?? 0) < limits.videos;
}
