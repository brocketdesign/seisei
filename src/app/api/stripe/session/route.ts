import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/utils/stripe';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '@/utils/resend';

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

        // Check if checkout session was processed by webhook
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

        // Webhook hasn't processed yet — fallback: create user directly
        console.log('[session] Webhook not processed yet, creating user directly for:', email);
        const result = await createUserFallback(session);

        if (result) {
            return NextResponse.json({
                status: 'ready',
                email,
                tempPassword: result.tempPassword,
            });
        }

        // Still processing
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

/**
 * Fallback: create user directly when webhook hasn't fired (e.g. webhook
 * delivery failed, port mismatch in local dev, or Stripe delay).
 */
async function createUserFallback(session: import('stripe').Checkout.Session) {
    const email = session.customer_details?.email;
    const metadata = session.metadata || {};

    if (!email) return null;

    const tempPassword = generateTempPassword();

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
        userId = existingUser.id;
        console.log('[session] User already exists:', userId);
        // Update password for auto-login
        await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: tempPassword,
        });
    } else {
        // Create user in Supabase Auth
        console.log('[session] Creating new user for:', email);
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                brand_name: metadata.brandName,
                stripe_customer_id: session.customer,
                subscription_id: session.subscription,
            },
        });

        if (authError) {
            console.error('[session] Auth error during fallback:', authError);
            return null;
        }

        if (!authData.user) return null;
        userId = authData.user.id;

        // Wait for handle_new_user trigger
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Update profile with onboarding data
    try {
        const { error: upsertError } = await supabaseAdmin.from('profiles').upsert({
            id: userId,
            brand_name: metadata.brandName || null,
            website: metadata.brandWebsite || null,
            description: metadata.brandDescription || null,
            categories: safeJsonParse(metadata.categories) || [],
            target_audience: safeJsonParse(metadata.targetAudience) || [],
            price_range: metadata.priceRange || null,
            monthly_volume: metadata.monthlyVolume || null,
            styles: safeJsonParse(metadata.styles) || [],
            platforms: safeJsonParse(metadata.platforms) || [],
            plan: metadata.planId || 'starter',
            billing_interval: metadata.billingInterval || 'month',
            updated_at: new Date().toISOString(),
        });
        if (upsertError) {
            console.error('[session] Profile upsert error:', upsertError);
            // Retry with update instead of upsert as a fallback
            const { error: updateError } = await supabaseAdmin.from('profiles').update({
                brand_name: metadata.brandName || null,
                website: metadata.brandWebsite || null,
                description: metadata.brandDescription || null,
                categories: safeJsonParse(metadata.categories) || [],
                target_audience: safeJsonParse(metadata.targetAudience) || [],
                price_range: metadata.priceRange || null,
                monthly_volume: metadata.monthlyVolume || null,
                styles: safeJsonParse(metadata.styles) || [],
                platforms: safeJsonParse(metadata.platforms) || [],
                plan: metadata.planId || 'starter',
                billing_interval: metadata.billingInterval || 'month',
                updated_at: new Date().toISOString(),
            }).eq('id', userId);
            if (updateError) {
                console.error('[session] Profile update fallback also failed:', updateError);
            }
        }
    } catch (profileErr) {
        console.error('[session] Error updating profile:', profileErr);
    }

    // Store checkout session
    await supabaseAdmin.from('checkout_sessions').upsert({
        session_id: session.id,
        user_id: userId,
        email,
        temp_password: tempPassword,
        processed: true,
        created_at: new Date().toISOString(),
    });

    // Send welcome email (best-effort)
    try {
        await sendWelcomeEmail(email, tempPassword, metadata.brandName);
        console.log('[session] Welcome email sent to:', email);
    } catch (emailErr) {
        console.error('[session] Failed to send welcome email:', emailErr);
    }

    console.log('[session] Fallback user creation completed for:', userId);
    return { tempPassword };
}

function generateTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 16; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

function safeJsonParse(str: string | undefined): string[] | null {
    if (!str) return null;
    try {
        return JSON.parse(str);
    } catch {
        return null;
    }
}
