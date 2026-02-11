import { NextRequest, NextResponse } from 'next/server';
import { getStripe, PLAN_PRICES } from '@/utils/stripe';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { planId, billingInterval = 'month', onboardingData } = body;

        console.log('[checkout] Plan selected:', planId, 'interval:', billingInterval);

        // Validate plan
        const plan = PLAN_PRICES[planId];
        if (!plan) {
            return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
        }

        // Validate billing interval
        if (billingInterval !== 'month' && billingInterval !== 'year') {
            return NextResponse.json({ error: 'Invalid billing interval' }, { status: 400 });
        }

        // For Enterprise plan, redirect to contact
        if (planId === 'enterprise') {
            return NextResponse.json({
                redirectUrl: '/contact',
                message: 'Enterprise plan requires consultation'
            });
        }

        // Free plan is a 3-day trial of the Starter plan
        const isFreeTrialPlan = planId === 'free';
        const effectivePlanId = isFreeTrialPlan ? 'starter' : planId;
        const effectivePlan = isFreeTrialPlan ? PLAN_PRICES['starter'] : plan;

        const priceYen = billingInterval === 'year'
            ? effectivePlan.yearlyPriceYen
            : effectivePlan.monthlyPriceYen;

        const intervalLabel = billingInterval === 'year' ? '年額' : '月額';

        const planLabel = isFreeTrialPlan
            ? `生成 - フリートライアル（3日間無料 → ${effectivePlan.name}プラン ${intervalLabel}）`
            : `生成 - ${plan.name}プラン（${intervalLabel}）`;

        const planDescription = isFreeTrialPlan
            ? `3日間無料でお試し。トライアル終了後は${effectivePlan.name}プラン（${intervalLabel} ¥${priceYen.toLocaleString()}）に自動移行します。`
            : plan.features.join('、');

        // Create Stripe Checkout session
        const session = await getStripe().checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [
                {
                    price_data: {
                        currency: 'jpy',
                        product_data: {
                            name: planLabel,
                            description: planDescription,
                        },
                        unit_amount: priceYen,
                        recurring: {
                            interval: billingInterval,
                        },
                    },
                    quantity: 1,
                },
            ],
            // 3-day free trial for the free plan
            ...(isFreeTrialPlan ? { subscription_data: { trial_period_days: 3 } } : {}),
            // Store onboarding data in metadata for webhook
            metadata: {
                planId,
                billingInterval,
                isFreeTrialPlan: isFreeTrialPlan ? 'true' : 'false',
                brandName: onboardingData.brand?.name || '',
                brandWebsite: onboardingData.brand?.website || '',
                brandDescription: onboardingData.brand?.description || '',
                categories: JSON.stringify(onboardingData.product?.categories || []),
                targetAudience: JSON.stringify(onboardingData.product?.targetAudience || []),
                priceRange: onboardingData.product?.priceRange || '',
                monthlyVolume: onboardingData.product?.monthlyVolume || '',
                styles: JSON.stringify(onboardingData.styles || []),
                platforms: JSON.stringify(onboardingData.platforms || []),
            },
            locale: 'ja',
            success_url: `${request.nextUrl.origin}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${request.nextUrl.origin}/onboarding?step=plan`,
            allow_promotion_codes: true,
        });

        console.log('[checkout] Stripe session created:', session.id, session.url);
        return NextResponse.json({ sessionUrl: session.url });
    } catch (error) {
        console.error('Stripe checkout error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
