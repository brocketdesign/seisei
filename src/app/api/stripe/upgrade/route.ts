import { NextRequest, NextResponse } from 'next/server';
import { getStripe, PLAN_PRICES } from '@/utils/stripe';
import { createClient } from '@/utils/supabase/server';

// Plan hierarchy (higher index = higher tier)
const PLAN_ORDER = ['starter', 'pro', 'business', 'enterprise'];

/**
 * Calculate the prorated amount for upgrading mid-cycle.
 * Billing cycle is calendar month (1st to last day).
 */
function calculateProratedAmount(
    currentPlanPrice: number,
    newPlanPrice: number,
    billingInterval: 'month' | 'year',
): { proratedAmount: number; daysRemaining: number; totalDays: number } {
    const now = new Date();

    if (billingInterval === 'year') {
        // For yearly plans, prorate based on days remaining in the year cycle
        const yearStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const yearEnd = new Date(Date.UTC(now.getUTCFullYear() + 1, now.getUTCMonth(), 1));
        const totalDays = Math.ceil((yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
        const daysElapsed = Math.ceil((now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = totalDays - daysElapsed;

        const dailyDifference = (newPlanPrice - currentPlanPrice) / totalDays;
        const proratedAmount = Math.max(0, Math.round(dailyDifference * daysRemaining));

        return { proratedAmount, daysRemaining, totalDays };
    }

    // Monthly: calculate days remaining in current month
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const totalDays = new Date(Date.UTC(year, month + 1, 0)).getUTCDate(); // days in month
    const currentDay = now.getUTCDate();
    const daysRemaining = totalDays - currentDay;

    // Daily price difference × remaining days
    const dailyDifference = (newPlanPrice - currentPlanPrice) / totalDays;
    const proratedAmount = Math.max(0, Math.round(dailyDifference * daysRemaining));

    return { proratedAmount, daysRemaining, totalDays };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { targetPlanId } = body;

        // Validate target plan
        const targetPlan = PLAN_PRICES[targetPlanId];
        if (!targetPlan) {
            return NextResponse.json({ error: '無効なプランです' }, { status: 400 });
        }

        // Enterprise requires consultation
        if (targetPlanId === 'enterprise') {
            return NextResponse.json({
                redirectUrl: '/contact',
                message: 'エンタープライズプランはお問い合わせが必要です',
            });
        }

        // Get current user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
        }

        // Get current plan from profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('plan, billing_interval')
            .eq('id', user.id)
            .single();

        const currentPlanId = profile?.plan ?? 'starter';
        const billingInterval = (profile?.billing_interval ?? 'month') as 'month' | 'year';
        const currentPlan = PLAN_PRICES[currentPlanId];

        if (!currentPlan) {
            return NextResponse.json({ error: '現在のプランが見つかりません' }, { status: 400 });
        }

        // Ensure it's actually an upgrade
        const currentIndex = PLAN_ORDER.indexOf(currentPlanId);
        const targetIndex = PLAN_ORDER.indexOf(targetPlanId);

        if (targetIndex <= currentIndex) {
            return NextResponse.json({ error: 'アップグレード先のプランは現在のプランより上位である必要があります' }, { status: 400 });
        }

        // Calculate prices based on billing interval
        const currentPrice = billingInterval === 'year' ? currentPlan.yearlyPriceYen : currentPlan.monthlyPriceYen;
        const targetPrice = billingInterval === 'year' ? targetPlan.yearlyPriceYen : targetPlan.monthlyPriceYen;

        // Calculate proration
        const { proratedAmount, daysRemaining, totalDays } = calculateProratedAmount(
            currentPrice,
            targetPrice,
            billingInterval,
        );

        if (proratedAmount <= 0) {
            // If 0 days remaining or no cost difference, just upgrade immediately
            const { createClient: createAdminClient } = await import('@supabase/supabase-js');
            const supabaseAdmin = createAdminClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { autoRefreshToken: false, persistSession: false } },
            );

            await supabaseAdmin.from('profiles').update({
                plan: targetPlanId,
                updated_at: new Date().toISOString(),
            }).eq('id', user.id);

            return NextResponse.json({ upgraded: true, message: 'プランをアップグレードしました' });
        }

        const intervalLabel = billingInterval === 'year' ? '年額' : '月額';

        // Create Stripe checkout session for prorated one-time payment
        const session = await getStripe().checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment', // One-time payment for the prorated difference
            customer_email: user.email ?? undefined,
            line_items: [
                {
                    price_data: {
                        currency: 'jpy',
                        product_data: {
                            name: `プランアップグレード: ${currentPlan.name} → ${targetPlan.name}`,
                            description: `${intervalLabel}プラン差額（残り${daysRemaining}日分 / ${totalDays}日中）`,
                        },
                        unit_amount: proratedAmount,
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                type: 'plan_upgrade',
                userId: user.id,
                currentPlanId,
                targetPlanId,
                billingInterval,
                proratedAmount: proratedAmount.toString(),
                daysRemaining: daysRemaining.toString(),
                totalDays: totalDays.toString(),
            },
            locale: 'ja',
            success_url: `${request.nextUrl.origin}/dashboard/settings?upgrade=success&plan=${targetPlanId}`,
            cancel_url: `${request.nextUrl.origin}/dashboard/settings?upgrade=cancelled`,
            allow_promotion_codes: true,
        });

        return NextResponse.json({
            sessionUrl: session.url,
            proratedAmount,
            daysRemaining,
            totalDays,
            currentPlan: currentPlan.name,
            targetPlan: targetPlan.name,
        });
    } catch (error) {
        console.error('[upgrade] Error:', error);
        return NextResponse.json(
            { error: 'アップグレード処理に失敗しました' },
            { status: 500 },
        );
    }
}

/**
 * GET: Calculate proration preview without creating a checkout session
 */
export async function GET(request: NextRequest) {
    try {
        const targetPlanId = request.nextUrl.searchParams.get('targetPlanId');

        if (!targetPlanId || !PLAN_PRICES[targetPlanId]) {
            return NextResponse.json({ error: '無効なプランです' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('plan, billing_interval')
            .eq('id', user.id)
            .single();

        const currentPlanId = profile?.plan ?? 'starter';
        const billingInterval = (profile?.billing_interval ?? 'month') as 'month' | 'year';
        const currentPlan = PLAN_PRICES[currentPlanId];
        const targetPlan = PLAN_PRICES[targetPlanId];

        if (!currentPlan || !targetPlan) {
            return NextResponse.json({ error: 'プランが見つかりません' }, { status: 400 });
        }

        const currentIndex = PLAN_ORDER.indexOf(currentPlanId);
        const targetIndex = PLAN_ORDER.indexOf(targetPlanId);

        if (targetIndex <= currentIndex) {
            return NextResponse.json({ error: 'アップグレード先は上位プランのみです' }, { status: 400 });
        }

        const currentPrice = billingInterval === 'year' ? currentPlan.yearlyPriceYen : currentPlan.monthlyPriceYen;
        const targetPrice = billingInterval === 'year' ? targetPlan.yearlyPriceYen : targetPlan.monthlyPriceYen;

        const { proratedAmount, daysRemaining, totalDays } = calculateProratedAmount(
            currentPrice,
            targetPrice,
            billingInterval,
        );

        return NextResponse.json({
            currentPlan: { id: currentPlanId, name: currentPlan.name, price: currentPrice },
            targetPlan: { id: targetPlanId, name: targetPlan.name, price: targetPrice },
            billingInterval,
            proratedAmount,
            daysRemaining,
            totalDays,
            fullPriceDifference: targetPrice - currentPrice,
        });
    } catch (error) {
        console.error('[upgrade preview] Error:', error);
        return NextResponse.json({ error: 'プレビュー取得に失敗しました' }, { status: 500 });
    }
}
