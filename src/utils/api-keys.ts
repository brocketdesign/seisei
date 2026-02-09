import { createHash, randomBytes } from 'crypto';
import { getAdminClient } from './storage';

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
 * Validate an API key by looking up its hash in the database.
 * Returns the owner's user_id and plan if valid.
 */
export async function validateApiKey(
    key: string,
): Promise<{ valid: true; userId: string; plan: string } | { valid: false }> {
    if (!key.startsWith(API_KEY_PREFIX)) {
        return { valid: false };
    }

    const hash = hashApiKey(key);
    const admin = getAdminClient();

    // Look up the key hash and join with the owner's profile for plan info
    const { data: apiKey, error } = await admin
        .from('api_keys')
        .select('id, user_id')
        .eq('key_hash', hash)
        .single();

    if (error || !apiKey) {
        return { valid: false };
    }

    // Get the user's plan
    const { data: profile } = await admin
        .from('profiles')
        .select('plan')
        .eq('id', apiKey.user_id)
        .single();

    // Update last_used_at (fire and forget)
    admin
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', apiKey.id)
        .then();

    return {
        valid: true,
        userId: apiKey.user_id,
        plan: profile?.plan ?? 'starter',
    };
}

const API_PLANS = ['business', 'enterprise'];

/**
 * Check if a plan has API access.
 */
export function hasApiAccess(plan: string): boolean {
    return API_PLANS.includes(plan);
}
