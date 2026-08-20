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
}

export const BILLING_PLANS: Record<BillingPlanKey, BillingPlanConfig> = {
  'core-monthly': {
    key: 'core-monthly',
    appPlanId: 'core',
    billingCycle: 'monthly',
    label: 'ProseLab Core — Monthly',
    whopPlanId: 'plan_jg59KIC0zEBCt',
  },
  'core-yearly': {
    key: 'core-yearly',
    appPlanId: 'core',
    billingCycle: 'yearly',
    label: 'ProseLab Core — Yearly',
    whopPlanId: 'plan_barEOMZvoYrej',
  },
  'premium-monthly': {
    key: 'premium-monthly',
    appPlanId: 'premium',
    billingCycle: 'monthly',
    label: 'ProseLab Premium — Monthly',
    whopPlanId: 'plan_LHuMredoSf6M1',
  },
  'premium-yearly': {
    key: 'premium-yearly',
    appPlanId: 'premium',
    billingCycle: 'yearly',
    label: 'ProseLab Premium — Yearly',
    whopPlanId: 'plan_6J4pmbiBtZAD0',
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
