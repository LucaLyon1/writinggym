import { supabaseAdmin } from '@/lib/supabase-admin'
import { syncBillingContactForUser } from '@/lib/billing-contact-sync'

export interface WhopSubscriptionSyncInput {
  userId: string
  planId: 'core' | 'premium'
  status: string
  membershipId: string
  customerId: string | null
  externalPlanId: string
  manageUrl: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  canceledAt: string | null
  providerUpdatedAt: string | null
}

export interface NormalizedWhopMembership {
  id: string
  status: string
  planId: string
  productId: string
  accountId: string
  customerId: string | null
  metadata: { [key: string]: unknown } | null
  manageUrl: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  canceledAt: string | null
  providerUpdatedAt: string | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object'
    ? value as Record<string, unknown>
    : null
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

/**
 * Whop's dated membership endpoint currently returns flat `plan_id`,
 * `product_id`, `user_id`, and `current_period_end` fields even though the SDK
 * declaration describes the richer webhook representation. Accept both shapes
 * so receipt and payment reconciliation stay compatible with the live API.
 */
export function normalizeWhopMembership(
  value: unknown,
  fallbacks: { customerId?: string | null; updatedAt?: string | null } = {}
): NormalizedWhopMembership {
  const membership = asRecord(value)
  const plan = asRecord(membership?.plan)
  const product = asRecord(membership?.product)
  const company = asRecord(membership?.company)
  const account = asRecord(membership?.account)
  const user = asRecord(membership?.user)

  const id = stringValue(membership?.id)
  const status = stringValue(membership?.status)
  const planId = stringValue(plan?.id) ?? stringValue(membership?.plan_id)
  const productId = stringValue(product?.id) ?? stringValue(membership?.product_id)
  const accountId = stringValue(company?.id) ?? stringValue(account?.id)

  if (!id || !status || !planId || !productId || !accountId) {
    throw new Error('Whop membership response is missing required identifiers')
  }

  return {
    id,
    status,
    planId,
    productId,
    accountId,
    customerId:
      stringValue(user?.id) ??
      stringValue(membership?.user_id) ??
      fallbacks.customerId ??
      null,
    metadata: asRecord(membership?.metadata),
    manageUrl: stringValue(membership?.manage_url),
    currentPeriodStart:
      stringValue(membership?.renewal_period_start) ??
      stringValue(membership?.current_period_start) ??
      stringValue(membership?.created_at),
    currentPeriodEnd:
      stringValue(membership?.renewal_period_end) ??
      stringValue(membership?.current_period_end),
    cancelAtPeriodEnd: membership?.cancel_at_period_end === true,
    canceledAt: stringValue(membership?.canceled_at),
    providerUpdatedAt:
      stringValue(membership?.updated_at) ??
      fallbacks.updatedAt ??
      stringValue(membership?.created_at),
  }
}

/**
 * Keep the application's entitlement row aligned with a verified Whop
 * membership. Both webhook delivery and checkout receipt reconciliation use
 * this function so either path can safely arrive first.
 */
export async function syncWhopSubscription(input: WhopSubscriptionSyncInput) {
  const { error } = await supabaseAdmin.from('subscriptions').upsert({
    user_id: input.userId,
    plan_id: input.planId,
    status: input.status,
    billing_provider: 'whop',
    external_customer_id: input.customerId,
    external_subscription_id: input.membershipId,
    external_plan_id: input.externalPlanId,
    manage_url: input.manageUrl,
    current_period_start: input.currentPeriodStart,
    current_period_end: input.currentPeriodEnd,
    cancel_at_period_end: input.cancelAtPeriodEnd,
    canceled_at: input.canceledAt,
    provider_updated_at: input.providerUpdatedAt,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    stripe_price_id: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (error) throw error

  if (input.status === 'active' || input.status === 'trialing') {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ is_founding_member: true })
      .eq('id', input.userId)
    if (profileError) throw profileError
  }

  await syncBillingContactForUser({
    userId: input.userId,
    status: input.status,
  })
}
