import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from './api-keys';
import { getAdminClient } from './storage';

export interface AdminUser {
    userId: string;
    email: string;
    plan: string;
}

/**
 * Authenticate an admin API request.
 * Validates the Bearer token, then checks that the user has role = 'admin' in profiles.
 */
export async function authenticateAdminRequest(
    request: NextRequest,
): Promise<{ user: AdminUser } | { error: NextResponse }> {
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

    const admin = getAdminClient();
    const { data: profile, error: profileError } = await admin
        .from('profiles')
        .select('role, email, plan')
        .eq('id', result.userId)
        .single();

    if (profileError || !profile) {
        return {
            error: NextResponse.json({ error: 'Profile not found' }, { status: 401 }),
        };
    }

    if (profile.role !== 'admin') {
        return {
            error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }),
        };
    }

    return {
        user: {
            userId: result.userId,
            email: profile.email,
            plan: profile.plan ?? 'starter',
        },
    };
}
