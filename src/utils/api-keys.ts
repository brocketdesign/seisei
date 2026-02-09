import { createHash, randomBytes } from 'crypto';
import { getAdminClient } from './storage';
import { getStripe } from './stripe';

const API_KEY_PREFIX = 'sk_live_';

/**
 * Generate a new API key with its hash and display prefix.
 */
export function generateApiKey() {
    const raw = randomBytes(32).toString('hex');
    const key = `${API_KEY_PREFIX}${raw}`;
    const hash = hashApiKey(key);
    const prefix = key.slice(0, 16) + '...';
    return { key, hash, prefix };
}

/**
 * SHA-256 hash of a plain API key.
 */
export function hashApiKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
}

/**
 * Try to determine the user's actual plan from their Stripe payment history.
 * This is a fallback for when the profiles.plan field is stale (e.g. webhook
 * didn't fire or failed silently).
 *
 * Returns the resolved plan ID and updates the profile, or null if unable to resolve.
 */
export async function syncPlanFromStripe(userId: string): Promise<string | null> {
    try {
        const admin = getAdminClient();

        // Get user's Stripe customer ID from auth metadata
        const { data: { user }, error } = await admin.auth.admin.getUserById(userId);
        if (error || !user) {
            console.error('[syncPlan] Failed to get user:', userId, error?.message);
            return null;
        }

        const customerId = user.user_metadata?.stripe_customer_id as string | undefined;
        if (!customerId) {
            console.log('[syncPlan] No Stripe customer ID for user:', userId);
            return null;
        }

        const stripe = getStripe();

        // List recent checkout sessions for this customer
        const sessions = await stripe.checkout.sessions.list({
            customer: customerId,
            limit: 20,
        });

        // 1. Prioritise the latest paid plan-upgrade session
        const latestUpgrade = sessions.data
            .filter(s => s.payment_status === 'paid' && s.metadata?.type === 'plan_upgrade')
            .sort((a, b) => (b.created ?? 0) - (a.created ?? 0))[0];

        if (latestUpgrade?.metadata?.targetPlanId) {
            const plan = latestUpgrade.metadata.targetPlanId;
            await admin.from('profiles').update({
                plan,
                updated_at: new Date().toISOString(),
            }).eq('id', userId);
            console.log('[syncPlan] Synced plan from Stripe upgrade session:', userId, '→', plan);
            return plan;
        }

        // 2. Fall back to the initial subscription checkout
        const latestCheckout = sessions.data
            .filter(s => s.payment_status === 'paid' && s.metadata?.planId && s.metadata?.type !== 'plan_upgrade')
            .sort((a, b) => (b.created ?? 0) - (a.created ?? 0))[0];

        if (latestCheckout?.metadata?.planId) {
            const plan = latestCheckout.metadata.planId;
            await admin.from('profiles').update({
                plan,
                updated_at: new Date().toISOString(),
            }).eq('id', userId);
            console.log('[syncPlan] Synced plan from Stripe checkout session:', userId, '→', plan);
            return plan;
        }

        console.log('[syncPlan] No plan info found in Stripe for user:', userId);
        return null;
    } catch (err) {
        console.error('[syncPlan] Error syncing plan from Stripe:', err);
        return null;
    }
}

/**
 * Validate an API key by looking up its hash in the database.
 * Returns the owner's user_id and plan if valid.
 *
 * When the cached profile plan does not include API access, this function
 * automatically attempts to resync the plan from Stripe payment history
 * (handles cases where the webhook didn't fire or the DB is stale).
 */
export async function validateApiKey(
    key: string,
): Promise<{ valid: true; userId: string; plan: string } | { valid: false }> {
    const trimmedKey = key.trim();
    if (!trimmedKey.startsWith(API_KEY_PREFIX)) {
        return { valid: false };
    }

    const hash = hashApiKey(trimmedKey);
    const admin = getAdminClient();

    // Look up the key hash and join with the owner's profile for plan info
    const { data: apiKey, error } = await admin
        .from('api_keys')
        .select('id, user_id')
        .eq('key_hash', hash)
        .single();

    if (error || !apiKey) {
        if (error) console.error('[validateApiKey] Key lookup failed:', error.message);
        return { valid: false };
    }

    // Get the user's plan
    const { data: profile, error: profileError } = await admin
        .from('profiles')
        .select('plan')
        .eq('id', apiKey.user_id)
        .single();

    if (profileError) {
        console.error('[validateApiKey] Profile lookup failed for user:', apiKey.user_id, profileError.message);
    }

    let plan = profile?.plan ?? 'starter';
    console.log('[validateApiKey] Resolved plan for user', apiKey.user_id, ':', plan);

    // If the cached plan doesn't have API access, try re-syncing from Stripe.
    // This self-heals stale profiles (e.g. webhook didn't fire after upgrade).
    if (!hasApiAccess(plan)) {
        console.log('[validateApiKey] Plan lacks API access, attempting Stripe sync for user:', apiKey.user_id);
        const syncedPlan = await syncPlanFromStripe(apiKey.user_id);
        if (syncedPlan) {
            plan = syncedPlan;
            console.log('[validateApiKey] Stripe sync resolved plan:', plan);
        }
    }

    // Update last_used_at (fire and forget)
    admin
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', apiKey.id)
        .then();

    return {
        valid: true,
        userId: apiKey.user_id,
        plan,
    };
}

const API_PLANS = ['business', 'enterprise'];

/**
 * Check if a plan has API access.
 */
export function hasApiAccess(plan: string): boolean {
    return API_PLANS.includes(plan);
}
