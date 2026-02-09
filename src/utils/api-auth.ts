import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, hasApiAccess } from './api-keys';
import { getAdminClient } from './storage';

export interface ApiUser {
    userId: string;
    plan: string;
}

/**
 * Authenticate an API request using Bearer token.
 * Returns either the authenticated user context or an error response.
 */
export async function authenticateApiRequest(
    request: NextRequest,
): Promise<{ user: ApiUser } | { error: NextResponse }> {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return {
            error: NextResponse.json(
                { error: 'Missing or invalid Authorization header. Use: Bearer sk_live_...' },
                { status: 401 },
            ),
        };
    }

    const apiKey = authHeader.slice(7);
    const result = await validateApiKey(apiKey);

    if (!result.valid) {
        return {
            error: NextResponse.json({ error: 'Invalid API key' }, { status: 401 }),
        };
    }

    if (!hasApiAccess(result.plan)) {
        return {
            error: NextResponse.json(
                { error: 'API access requires a Business or Enterprise plan' },
                { status: 403 },
            ),
        };
    }

    return { user: { userId: result.userId, plan: result.plan } };
}

/**
 * Get an admin Supabase client (re-exported for convenience).
 */
export { getAdminClient };
