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

        const priceYen = billingInterval === 'year'
            ? plan.yearlyPriceYen
            : plan.monthlyPriceYen;

        const intervalLabel = billingInterval === 'year' ? '年額' : '月額';

        // Create Stripe Checkout session
        const session = await getStripe().checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [
                {
                    price_data: {
                        currency: 'jpy',
                        product_data: {
                            name: `生成 - ${plan.name}プラン（${intervalLabel}）`,
                            description: plan.features.join('、'),
                        },
                        unit_amount: priceYen,
                        recurring: {
                            interval: billingInterval,
                        },
                    },
                    quantity: 1,
                },
            ],
            // Store onboarding data in metadata for webhook
            metadata: {
                planId,
                billingInterval,
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
