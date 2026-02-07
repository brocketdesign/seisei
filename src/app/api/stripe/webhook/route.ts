import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Use service role key for admin operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
        event = stripe.webhooks.constructEvent(
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
            await handleCheckoutCompleted(session);
        } catch (error) {
            console.error('Error handling checkout completion:', error);
            return NextResponse.json({ error: 'Failed to process checkout' }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const customerEmail = session.customer_details?.email;
    const metadata = session.metadata || {};

    if (!customerEmail) {
        throw new Error('No customer email found in session');
    }

    console.log('Processing checkout for:', customerEmail);

    // Generate a temporary password
    const tempPassword = generateTempPassword();

    // Create user in Supabase Auth
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
            console.log('User already exists, updating profile...');
            const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
            const user = existingUser?.users?.find(u => u.email === customerEmail);
            if (user) {
                await updateUserProfile(user.id, metadata);
            }
            return;
        }
        throw authError;
    }

    if (!authData.user) {
        throw new Error('Failed to create user');
    }

    // Update user profile with onboarding data
    await updateUserProfile(authData.user.id, metadata);

    // Store the session info for auto-login
    await supabaseAdmin.from('checkout_sessions').upsert({
        session_id: session.id,
        user_id: authData.user.id,
        email: customerEmail,
        temp_password: tempPassword,
        processed: true,
        created_at: new Date().toISOString(),
    }).select();

    console.log('User created successfully:', authData.user.id);
}

async function updateUserProfile(userId: string, metadata: Record<string, string>) {
    const { error } = await supabaseAdmin.from('profiles').upsert({
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
        updated_at: new Date().toISOString(),
    });

    if (error) {
        console.error('Error updating profile:', error);
        throw error;
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
