import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getAdminClient } from '@/utils/storage';

/**
 * POST: Create a new campaign.
 * Uses admin client to bypass RLS.
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, status } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: 'キャンペーン名を入力してください。' }, { status: 400 });
        }

        const adminClient = getAdminClient();
        const { data: campaign, error: dbError } = await adminClient
            .from('campaigns')
            .insert({
                user_id: user.id,
                name: name.trim(),
                description: description || null,
                status: status || 'draft',
            })
            .select()
            .single();

        if (dbError) {
            console.error('Campaign insert error:', dbError);
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }

        return NextResponse.json({ campaign });
    } catch (error) {
        console.error('Campaign creation error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Internal server error',
        }, { status: 500 });
    }
}
