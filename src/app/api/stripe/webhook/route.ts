import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/utils/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { sendWelcomeEmail } from '@/utils/resend';

// Use service role key for admin operations
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) {
    console.warn('[webhook] WARNING: SUPABASE_SERVICE_ROLE_KEY is not set. Webhook will fail to create users.');
}
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = getStripe().webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        try {
            // Check if this is a plan upgrade payment
            if (session.metadata?.type === 'plan_upgrade') {
                await handlePlanUpgrade(session);
            } else {
                await handleCheckoutCompleted(session);
            }
        } catch (error) {
            console.error('Error handling checkout completion:', error);
            return NextResponse.json({ error: 'Failed to process checkout' }, { status: 500 });
        }
    }

    // Handle trial ending → upgrade free plan to starter
    if (event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as Stripe.Subscription;

        try {
            // When a trial ends and the subscription becomes active (paid),
            // upgrade the user's plan from "free" to "starter"
            if (subscription.status === 'active' && !subscription.trial_end) {
                const previousAttributes = (event.data as Stripe.Event.Data & { previous_attributes?: Record<string, unknown> }).previous_attributes;
                if (previousAttributes?.trial_end || previousAttributes?.status === 'trialing') {
                    await handleTrialEnded(subscription);
                }
            }
        } catch (error) {
            console.error('Error handling subscription update:', error);
        }
    }

    return NextResponse.json({ received: true });
}

async function handlePlanUpgrade(session: Stripe.Checkout.Session) {
    const metadata = session.metadata || {};
    const userId = metadata.userId;
    const targetPlanId = metadata.targetPlanId;
    const billingInterval = metadata.billingInterval || 'month';

    if (!userId || !targetPlanId) {
        throw new Error('Missing userId or targetPlanId in upgrade metadata');
    }

    console.log('[webhook] Processing plan upgrade for user:', userId, '→', targetPlanId);

    // Update the user's plan in their profile
    let { error } = await supabaseAdmin.from('profiles').update({
        plan: targetPlanId,
        billing_interval: billingInterval,
        updated_at: new Date().toISOString(),
    }).eq('id', userId);

    // Fallback: if billing_interval column doesn't exist yet, retry without it
    if (error?.code === 'PGRST204' || error?.message?.includes('billing_interval')) {
        console.warn('[webhook] billing_interval column missing, retrying without it');
        ({ error } = await supabaseAdmin.from('profiles').update({
            plan: targetPlanId,
            updated_at: new Date().toISOString(),
        }).eq('id', userId));
    }

    if (error) {
        console.error('[webhook] Error upgrading plan:', error);
        throw error;
    }

    console.log('[webhook] Plan upgrade completed:', userId, '→', targetPlanId);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const customerEmail = session.customer_details?.email;
    const metadata = session.metadata || {};

    if (!customerEmail) {
        throw new Error('No customer email found in session');
    }

    if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured — cannot create users');
    }

    console.log('[webhook] Processing checkout for:', customerEmail);

    // Generate a temporary password
    const tempPassword = generateTempPassword();

    // Create user in Supabase Auth
    console.log('[webhook] Creating user in Supabase Auth...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: customerEmail,
        password: tempPassword,
        email_confirm: true, // Skip email confirmation since they paid
        user_metadata: {
            brand_name: metadata.brandName,
            stripe_customer_id: session.customer,
            subscription_id: session.subscription,
        },
    });

    if (authError) {
        // If user already exists, update their profile instead
        if (authError.message?.includes('already been registered')) {
            console.log('[webhook] User already exists, updating profile...');
            const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
            const user = existingUser?.users?.find(u => u.email === customerEmail);
            if (user) {
                await updateUserProfile(user.id, metadata);
                // Still store checkout session for auto-login
                await supabaseAdmin.from('checkout_sessions').upsert({
                    session_id: session.id,
                    user_id: user.id,
                    email: customerEmail,
                    temp_password: tempPassword,
                    processed: true,
                    created_at: new Date().toISOString(),
                });
                // Update their password so auto-login works
                await supabaseAdmin.auth.admin.updateUserById(user.id, {
                    password: tempPassword,
                });

                // Send welcome email with updated credentials
                try {
                    await sendWelcomeEmail(customerEmail, tempPassword, metadata.brandName);
                    console.log('[webhook] Welcome email sent to existing user:', customerEmail);
                } catch (emailErr) {
                    console.error('[webhook] Failed to send welcome email:', emailErr);
                }
            }
            return;
        }
        console.error('[webhook] Auth error:', authError);
        throw authError;
    }

    if (!authData.user) {
        throw new Error('Failed to create user');
    }

    console.log('[webhook] User created:', authData.user.id);

    // Wait briefly for the handle_new_user trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update user profile with onboarding data
    console.log('[webhook] Updating profile...');
    await updateUserProfile(authData.user.id, metadata);

    // Store the session info for auto-login
    console.log('[webhook] Storing checkout session...');
    const { error: sessionError } = await supabaseAdmin.from('checkout_sessions').upsert({
        session_id: session.id,
        user_id: authData.user.id,
        email: customerEmail,
        temp_password: tempPassword,
        processed: true,
        created_at: new Date().toISOString(),
    });

    if (sessionError) {
        console.error('[webhook] Error storing checkout session:', sessionError);
        throw sessionError;
    }

    // Send welcome email with login credentials
    try {
        await sendWelcomeEmail(customerEmail, tempPassword, metadata.brandName);
        console.log('[webhook] Welcome email sent to:', customerEmail);
    } catch (emailErr) {
        // Don't throw — user was created successfully, email is best-effort
        console.error('[webhook] Failed to send welcome email:', emailErr);
    }

    console.log('[webhook] Checkout completed successfully for:', authData.user.id);
}

async function handleTrialEnded(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    console.log('[webhook] Trial ended for customer:', customerId, '→ upgrading to starter');

    // Find the user by their stripe_customer_id in auth metadata
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    const user = usersData?.users?.find(
        u => u.user_metadata?.stripe_customer_id === customerId
    );

    if (!user) {
        console.warn('[webhook] Could not find user for customer:', customerId);
        return;
    }

    // Update plan from "free" to "starter"
    const { error } = await supabaseAdmin.from('profiles').update({
        plan: 'starter',
        updated_at: new Date().toISOString(),
    }).eq('id', user.id).eq('plan', 'free');

    if (error) {
        console.error('[webhook] Error upgrading trial user to starter:', error);
        throw error;
    }

    console.log('[webhook] Trial ended, user upgraded to starter:', user.id);
}

async function updateUserProfile(userId: string, metadata: Record<string, string>) {
    const profileData = {
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
    };

    const { error } = await supabaseAdmin.from('profiles').upsert(profileData);

    if (error) {
        console.error('Error upserting profile, trying update fallback:', error);
        // Fallback: try update instead of upsert
        const { id, ...updateData } = profileData;
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update(updateData)
            .eq('id', userId);
        if (updateError) {
            console.error('Error updating profile (fallback):', updateError);
            throw updateError;
        }
    }
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
