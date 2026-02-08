import Stripe from 'stripe';

// Server-side Stripe instance (lazy-initialized to avoid build-time errors
// when STRIPE_SECRET_KEY is not available)
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
    if (!_stripe) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) {
            throw new Error('STRIPE_SECRET_KEY environment variable is not set');
        }
        _stripe = new Stripe(key, {
            apiVersion: '2026-01-28.clover',
            typescript: true,
        });
    }
    return _stripe;
}

/** @deprecated Use getStripe() instead */
export const stripe = undefined as unknown as Stripe;

// Plan limits per billing cycle
export interface PlanLimits {
    images: number;   // Max image generations per month
    videos: number;   // Max video generations per month
}

// Plan configuration
export interface PlanConfig {
    name: string;
    monthlyPriceYen: number;
    yearlyPriceYen: number;  // 20% discount applied
    limits: PlanLimits;
    features: string[];
}

// Plan price IDs mapping
// You can create these in Stripe Dashboard or dynamically
export const PLAN_PRICES: Record<string, PlanConfig> = {
    starter: {
        name: 'スターター',
        monthlyPriceYen: 5000,
        yearlyPriceYen: 48000,  // ¥5,000 × 12 × 0.8 = ¥48,000/year
        limits: { images: 50, videos: 0 },
        features: ['月50枚画像生成', '動画生成なし', '標準画質', 'メールサポート'],
    },
    pro: {
        name: 'プロフェッショナル',
        monthlyPriceYen: 20000,
        yearlyPriceYen: 192000,  // ¥20,000 × 12 × 0.8 = ¥192,000/year
        limits: { images: 500, videos: 50 },
        features: ['月500枚画像生成', '月50本動画生成', '4K高画質', '優先サポート', '商用利用完全保証'],
    },
    business: {
        name: 'ビジネス',
        monthlyPriceYen: 50000,
        yearlyPriceYen: 480000,  // ¥50,000 × 12 × 0.8 = ¥480,000/year
        limits: { images: 2000, videos: 200 },
        features: ['月2,000枚画像生成', '月200本動画生成', '4K高画質', '専属サポート', '商用利用完全保証', 'API連携'],
    },
    enterprise: {
        name: 'エンタープライズ',
        monthlyPriceYen: 100000, // Contact for custom pricing
        yearlyPriceYen: 960000,
        limits: { images: -1, videos: -1 }, // Custom / unlimited
        features: ['カスタム生成数', '専属マネージャー', 'カスタムモデル', 'API連携'],
    },
};

/**
 * Get the plan limits for a given plan ID.
 * Returns starter limits if the plan is not found.
 */
export function getPlanLimits(planId: string): PlanLimits {
    return PLAN_PRICES[planId]?.limits ?? PLAN_PRICES.starter.limits;
}
