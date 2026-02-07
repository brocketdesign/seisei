import Stripe from 'stripe';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
    typescript: true,
});

// Plan price IDs mapping
// You can create these in Stripe Dashboard or dynamically
export const PLAN_PRICES: Record<string, { name: string; priceYen: number; features: string[] }> = {
    starter: {
        name: 'スターター',
        priceYen: 5000,
        features: ['月50枚生成', '標準画質', 'メールサポート'],
    },
    pro: {
        name: 'プロフェッショナル',
        priceYen: 20000,
        features: ['無制限生成', '4K高画質', '優先サポート', '商用利用完全保証'],
    },
    enterprise: {
        name: 'エンタープライズ',
        priceYen: 100000, // Contact for custom pricing
        features: ['API連携', '専属マネージャー', 'カスタムモデル'],
    },
};
