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

// Re-export plan configuration from shared module (safe for client & server)
export { PLAN_PRICES, getPlanLimits } from './plans';
export type { PlanLimits, PlanConfig } from './plans';
