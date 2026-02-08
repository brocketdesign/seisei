import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/utils/stripe';
import { createClient } from '@supabase/supabase-js';

// Use service role key for admin operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
    const sessionId = request.nextUrl.searchParams.get('session_id');

    if (!sessionId) {
        return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    try {
        // Retrieve the Stripe session
        const session = await getStripe().checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== 'paid') {
            return NextResponse.json({
                status: 'pending',
                message: 'Payment not yet confirmed'
            });
        }

        const email = session.customer_details?.email;

        if (!email) {
            return NextResponse.json({ error: 'No email found' }, { status: 400 });
        }

        // Check if checkout session was processed
        const { data: checkoutData } = await supabaseAdmin
            .from('checkout_sessions')
            .select('user_id, temp_password, processed')
            .eq('session_id', sessionId)
            .single();

        if (checkoutData?.processed && checkoutData.temp_password) {
            // Return credentials for auto-login
            return NextResponse.json({
                status: 'ready',
                email,
                tempPassword: checkoutData.temp_password,
            });
        }

        // Webhook hasn't processed yet, return pending
        return NextResponse.json({
            status: 'processing',
            message: 'Account setup in progress'
        });

    } catch (error) {
        console.error('Session verification error:', error);
        return NextResponse.json(
            { error: 'Failed to verify session' },
            { status: 500 }
        );
    }
}
