// Plan limits per billing cycle
export interface PlanLimits {
    images: number;   // Max image generations per month (-1 = unlimited)
    videos: number;   // Max video generations per month (-1 = unlimited)
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
export const PLAN_PRICES: Record<string, PlanConfig> = {
    free: {
        name: 'フリー',
        monthlyPriceYen: 0,
        yearlyPriceYen: 0,
        limits: { images: 10, videos: 0 },
        features: ['3日間無料トライアル', '月10枚画像生成', '標準画質', 'メールサポート'],
    },
    starter: {
        name: 'スターター',
        monthlyPriceYen: 5000,
        yearlyPriceYen: 48000,
        limits: { images: 50, videos: 0 },
        features: ['月50枚画像生成', '動画生成なし', '標準画質', 'メールサポート'],
    },
    pro: {
        name: 'プロフェッショナル',
        monthlyPriceYen: 20000,
        yearlyPriceYen: 192000,
        limits: { images: 500, videos: 50 },
        features: ['月500枚画像生成', '月50本動画生成', '4K高画質', '優先サポート', '商用利用完全保証'],
    },
    business: {
        name: 'ビジネス',
        monthlyPriceYen: 50000,
        yearlyPriceYen: 480000,
        limits: { images: 2000, videos: 200 },
        features: ['月2,000枚画像生成', '月200本動画生成', '4K高画質', '専属サポート', '商用利用完全保証', 'API連携'],
    },
    enterprise: {
        name: 'エンタープライズ',
        monthlyPriceYen: 100000,
        yearlyPriceYen: 960000,
        limits: { images: -1, videos: -1 },
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
