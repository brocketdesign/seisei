import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch the 20 most recent completed generations for this user
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: generations, error: dbError } = await (supabase as any)
            .from('generations')
            .select('id, generated_image_url, model_type, background, aspect_ratio, status, ai_model_id, campaign_id, created_at')
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(50);

        if (dbError) {
            console.error('Database error fetching history:', dbError);
            return NextResponse.json(
                { error: 'Failed to load history' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            generations: generations || [],
        });
    } catch (error) {
        console.error('History fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to load history' },
            { status: 500 }
        );
    }
}
