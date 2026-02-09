import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getAdminClient } from '@/utils/storage';
import { generateApiKey, hasApiAccess } from '@/utils/api-keys';

/**
 * GET /api/api-keys — List the current user's API keys.
 */
export async function GET() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: keys, error } = await supabase
        .from('api_keys')
        .select('id, name, key_prefix, last_used_at, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[api/api-keys] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
    }

    return NextResponse.json({ keys });
}

/**
 * POST /api/api-keys — Create a new API key.
 * Requires Business or Enterprise plan.
 * Body: { name: string }
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check plan
    const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();

    const plan = profile?.plan ?? 'starter';
    if (!hasApiAccess(plan)) {
        return NextResponse.json(
            { error: 'API access requires a Business or Enterprise plan' },
            { status: 403 },
        );
    }

    const { name } = await request.json();
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const { key, hash, prefix } = generateApiKey();

    // Insert via admin client (RLS has no INSERT policy for api_keys on purpose)
    const admin = getAdminClient();
    const { error } = await admin.from('api_keys').insert({
        user_id: user.id,
        name: name.trim(),
        key_hash: hash,
        key_prefix: prefix,
    });

    if (error) {
        console.error('[api/api-keys] POST error:', error);
        return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
    }

    // Return the plain key once — it cannot be retrieved again
    return NextResponse.json({ key, prefix, name: name.trim() }, { status: 201 });
}

/**
 * DELETE /api/api-keys — Revoke an API key.
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
        return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // RLS ensures users can only delete their own keys
    const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('[api/api-keys] DELETE error:', error);
        return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
