/**
 * Whop refund handling: revoke app access when a payment is fully refunded.
 *
 * Whop sends `refund.created` / `refund.updated` (docs.whop.com/api-reference/refunds/refund-created).
 * The refund payload carries the original payment, but not the payment's refund
 * totals, so we re-fetch the payment (`payments.retrieve`) to decide whether it
 * is fully refunded and to resolve the membership id.
 *
 * Policy: only a *fully* refunded payment revokes access. Partial refunds
 * (goodwill credits, prorations) leave the subscription untouched.
 *
 * Kept free of runtime imports of Supabase/Whop/PostHog so it can be unit
 * tested with injected dependencies.
 */

/** Statuses the app treats as entitled (lib/plan.ts, billing-contact-sync). */
export const ENTITLED_STATUSES = ['active', 'trialing'] as const
/** Statuses we will revoke from. Anything else is already inactive: no-op. */
export const REVOCABLE_STATUSES = ['active', 'trialing', 'past_due', 'canceling'] as const
/** Terminal status written on refund (also a native Whop membership status). */
export const REFUND_REVOKED_STATUS = 'canceled'

export interface WhopRefundEventData {
  id: string
  status: string
  amount?: number | null
  payment: { id: string; membership?: { id: string } | null } | null
}

export interface WhopRefundPayment {
  id: string
  substatus?: string | null
  total?: number | null
  refunded_amount?: number | null
  refunded_at?: string | null
  membership?: { id: string } | null
}

type QueryResult = { data: { user_id: string; plan_id: string } | null; error: unknown }

/** Minimal slice of the Supabase query builder used here. */
export interface SubscriptionFilter {
  eq(column: string, value: string): SubscriptionFilter
  in(column: string, values: string[]): SubscriptionFilter
  select(columns: string): { maybeSingle(): PromiseLike<QueryResult> }
}
export interface SubscriptionsTable {
  update(values: Record<string, unknown>): SubscriptionFilter
}

const TERMINAL_STATUSES = new Set(['canceled', 'expired', 'completed'])

/**
 * A `membership.cancel_at_period_end_changed` event can arrive after a refund
 * revoke while Whop still reports the membership as active. Never let that
 * flip a terminal row for the same membership back to an entitled status.
 */
export function isStaleReactivation(
  existingStatus: string | null | undefined,
  incomingStatus: string
): boolean {
  return (
    !!existingStatus &&
    TERMINAL_STATUSES.has(existingStatus) &&
    (ENTITLED_STATUSES as readonly string[]).includes(incomingStatus)
  )
}

export interface RefundDeps {
  subscriptions: SubscriptionsTable
  retrievePayment(id: string): Promise<WhopRefundPayment>
  onRevoked(input: {
    userId: string
    planId: string
    membershipId: string
    paymentId: string
    refundId: string
  }): Promise<void>
  now?: () => Date
}

export type RefundOutcome =
  | { action: 'revoked'; userId: string; membershipId: string }
  | { action: 'ignored'; reason: string }

export function isFullyRefunded(payment: WhopRefundPayment): boolean {
  if (payment.substatus === 'refunded' || payment.substatus === 'auto_refunded') return true
  if (payment.substatus === 'partially_refunded') return false
  const total = payment.total
  const refunded = payment.refunded_amount
  if (typeof total === 'number' && typeof refunded === 'number' && total > 0) {
    return refunded + 0.005 >= total
  }
  return false
}

export async function handleWhopRefund(
  refund: WhopRefundEventData,
  deps: RefundDeps
): Promise<RefundOutcome> {
  if (refund.status !== 'succeeded') {
    return { action: 'ignored', reason: `refund status ${refund.status}` }
  }
  const paymentId = refund.payment?.id
  if (!paymentId) return { action: 'ignored', reason: 'refund has no payment' }

  const payment = await deps.retrievePayment(paymentId)
  if (!isFullyRefunded(payment)) {
    return { action: 'ignored', reason: 'partial refund' }
  }

  const membershipId = payment.membership?.id ?? refund.payment?.membership?.id
  if (!membershipId) return { action: 'ignored', reason: 'payment has no membership' }

  const nowIso = (deps.now?.() ?? new Date()).toISOString()
  const { data, error } = await deps.subscriptions
    .update({
      status: REFUND_REVOKED_STATUS,
      canceled_at: payment.refunded_at ?? nowIso,
      cancel_at_period_end: false,
      updated_at: nowIso,
    })
    .eq('billing_provider', 'whop')
    .eq('external_subscription_id', membershipId)
    .in('status', [...REVOCABLE_STATUSES])
    .select('user_id, plan_id')
    .maybeSingle()

  if (error) throw error
  if (!data) {
    return { action: 'ignored', reason: 'no entitled whop row for membership' }
  }

  await deps.onRevoked({
    userId: data.user_id,
    planId: data.plan_id,
    membershipId,
    paymentId,
    refundId: refund.id,
  })
  return { action: 'revoked', userId: data.user_id, membershipId }
}
