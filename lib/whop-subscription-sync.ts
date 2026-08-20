import { supabaseAdmin } from '@/lib/supabase-admin'

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
}
