export type BillingPlanKey =
  | 'core-monthly'
  | 'core-yearly'
  | 'premium-monthly'
  | 'premium-yearly'

export interface BillingPlanConfig {
  key: BillingPlanKey
  appPlanId: 'core' | 'premium'
  billingCycle: 'monthly' | 'yearly'
  label: string
  whopPlanId: string
  /** List price charged per billing period on Whop (USD), for pixel values. */
  priceUsd: number
}

export const BILLING_PLANS: Record<BillingPlanKey, BillingPlanConfig> = {
  'core-monthly': {
    key: 'core-monthly',
    appPlanId: 'core',
    billingCycle: 'monthly',
    label: 'ProseLab Core — Monthly',
    whopPlanId: 'plan_8DqqLDO3hxKAh',
    priceUsd: 9.99,
  },
  'core-yearly': {
    key: 'core-yearly',
    appPlanId: 'core',
    billingCycle: 'yearly',
    label: 'ProseLab Core — Yearly',
    whopPlanId: 'plan_1E7RwuJBhlZBZ',
    priceUsd: 99,
  },
  'premium-monthly': {
    key: 'premium-monthly',
    appPlanId: 'premium',
    billingCycle: 'monthly',
    label: 'ProseLab Premium — Monthly',
    whopPlanId: 'plan_LHuMredoSf6M1',
    priceUsd: 9.99,
  },
  'premium-yearly': {
    key: 'premium-yearly',
    appPlanId: 'premium',
    billingCycle: 'yearly',
    label: 'ProseLab Premium — Yearly',
    whopPlanId: 'plan_6J4pmbiBtZAD0',
    priceUsd: 99,
  },
}

export function isBillingPlanKey(value: unknown): value is BillingPlanKey {
  return typeof value === 'string' && value in BILLING_PLANS
}

export function getBillingPlanByWhopId(whopPlanId: string): BillingPlanConfig | null {
  return Object.values(BILLING_PLANS).find((plan) => plan.whopPlanId === whopPlanId) ?? null
}

export function isConfiguredBillingPlan(plan: BillingPlanConfig): boolean {
  return !plan.whopPlanId.includes('PENDING')
}
