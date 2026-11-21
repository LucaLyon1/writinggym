/**
 * Server-side billing analytics for PostHog, kept free of Next.js, Supabase
 * and `@/` imports so it can be unit tested with `node --test`.
 *
 * Every event gets a deterministic `uuid` and a provider `timestamp`. PostHog
 * de-duplicates events that share uuid, distinct id, event name and timestamp,
 * so a Whop webhook retry, or the webhook and the checkout receipt sync both
 * reporting the same payment, records one purchase rather than two.
 */
import { createHash } from 'node:crypto'

export type AppPlanId = 'core' | 'premium'
export type BillingInterval = 'monthly' | 'yearly'

export interface ServerAnalyticsEvent {
  distinctId: string
  event: string
  properties: Record<string, unknown>
  uuid: string
  timestamp?: Date
}

/** The subset of a Whop payment the purchase events read. */
export interface PurchasePaymentLike {
  id: string
  total?: number | null
  usd_total?: number | null
  subtotal?: number | null
  currency?: string | null
  billing_reason?: string | null
  paid_at?: string | null
  created_at?: string | null
  membership?: { id: string } | null
  plan?: { id: string } | null
  promo_code?: { id: string } | null
}

/** Stable RFC 4122-shaped UUID derived from a seed (so retries map to one event). */
export function deterministicUuid(seed: string): string {
  const hex = createHash('sha256').update(seed).digest('hex').slice(0, 32).split('')
  hex[12] = '5' // version nibble
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16) // variant bits
  const s = hex.join('')
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`
}

function toDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function isRenewalPayment(billingReason: string | null | undefined): boolean {
  return billingReason === 'subscription_cycle'
}

/**
 * `purchase_completed` for every successful Whop payment (first purchase and
 * renewals), plus `subscription_renewed` for renewals. Amounts are in major
 * currency units, as Whop reports them. `revenue`/`$revenue` carry the amount
 * so PostHog revenue analytics and insights can sum it directly.
 */
export function buildPurchaseEvents(input: {
  userId: string
  payment: PurchasePaymentLike
  appPlanId: AppPlanId | null
  interval: BillingInterval | null
  source: 'whop_webhook' | 'checkout_sync'
}): ServerAnalyticsEvent[] {
  const { userId, payment, appPlanId, interval, source } = input
  const amount =
    typeof payment.total === 'number' ? payment.total
    : typeof payment.subtotal === 'number' ? payment.subtotal
    : null
  const currency = (payment.currency ?? 'usd').toUpperCase()
  const isRenewal = isRenewalPayment(payment.billing_reason)
  const timestamp = toDate(payment.paid_at) ?? toDate(payment.created_at)

  const properties: Record<string, unknown> = {
    provider: 'whop',
    source,
    plan_id: appPlanId,
    whop_plan_id: payment.plan?.id ?? null,
    whop_payment_id: payment.id,
    whop_membership_id: payment.membership?.id ?? null,
    interval,
    billing_reason: payment.billing_reason ?? null,
    is_renewal: isRenewal,
    promo_code_id: payment.promo_code?.id ?? null,
    amount: amount === null ? null : roundMoney(amount),
    currency,
    revenue: amount === null ? null : roundMoney(amount),
    $revenue: amount === null ? null : roundMoney(amount),
    amount_usd: typeof payment.usd_total === 'number' ? roundMoney(payment.usd_total) : null,
    $set: {
      ...(appPlanId ? { plan_tier: appPlanId } : {}),
      ...(interval ? { billing_interval: interval } : {}),
      subscription_status: 'active',
      is_paying_customer: true,
    },
  }

  const events: ServerAnalyticsEvent[] = [
    {
      distinctId: userId,
      event: 'purchase_completed',
      properties,
      uuid: deterministicUuid(`purchase_completed:${payment.id}`),
      timestamp,
    },
  ]
  if (isRenewal) {
    const renewalProperties = { ...properties }
    delete renewalProperties.$set
    events.push({
      distinctId: userId,
      event: 'subscription_renewed',
      properties: renewalProperties,
      uuid: deterministicUuid(`subscription_renewed:${payment.id}`),
      timestamp,
    })
  }
  return events
}

export interface MembershipChangeInput {
  userId: string
  webhookEventId: string
  type: 'membership.activated' | 'membership.deactivated' | 'membership.cancel_at_period_end_changed'
  appPlanId: AppPlanId
  whopPlanId: string
  membershipId: string
  status: string
  cancelAtPeriodEnd: boolean
  interval: BillingInterval | null
  occurredAt?: string | null
}

/**
 * Lifecycle events from Whop membership webhooks. Keeps the existing
 * `subscription_activated`/`subscription_started`/`subscription_updated`
 * names so current insights carry on working, and adds explicit
 * cancellation events.
 */
export function buildMembershipEvents(input: MembershipChangeInput): ServerAnalyticsEvent[] {
  const properties: Record<string, unknown> = {
    provider: 'whop',
    plan_id: input.appPlanId,
    whop_plan_id: input.whopPlanId,
    whop_membership_id: input.membershipId,
    status: input.status,
    cancel_at_period_end: input.cancelAtPeriodEnd,
    interval: input.interval,
  }
  const timestamp = toDate(input.occurredAt)
  const make = (event: string, extra: Record<string, unknown> = {}): ServerAnalyticsEvent => ({
    distinctId: input.userId,
    event,
    properties: { ...properties, ...extra },
    uuid: deterministicUuid(`${event}:${input.webhookEventId}`),
    timestamp,
  })

  if (input.type === 'membership.activated') {
    return [make('subscription_activated'), make('subscription_started')]
  }
  const events = [make('subscription_updated')]
  if (input.type === 'membership.deactivated') {
    events.push(make('subscription_canceled', {
      reason: 'deactivated',
      $set: { subscription_status: input.status, is_paying_customer: false },
    }))
  } else if (input.cancelAtPeriodEnd) {
    events.push(make('subscription_cancel_scheduled', { $set: { subscription_status: 'canceling' } }))
  } else {
    events.push(make('subscription_cancel_reverted', { $set: { subscription_status: input.status } }))
  }
  return events
}

export interface CaptureClient {
  capture(event: ServerAnalyticsEvent): void
  shutdown(timeoutMs?: number): Promise<void>
}

/**
 * Send events and flush before the serverless function returns. Never throws:
 * analytics must not fail a billing webhook or the checkout sync.
 */
export async function sendServerEvents(
  events: ServerAnalyticsEvent[],
  createClient: () => CaptureClient | null,
  options: { shutdownTimeoutMs?: number; logger?: Pick<Console, 'error' | 'warn'> } = {}
): Promise<boolean> {
  if (events.length === 0) return true
  const logger = options.logger ?? console
  let client: CaptureClient | null = null
  try {
    client = createClient()
    if (!client) {
      logger.warn('[posthog] Server key is not configured; skipping', events.map((e) => e.event))
      return false
    }
    for (const event of events) client.capture(event)
  } catch (error) {
    logger.error('[posthog] Failed to capture server events:', error)
  }
  if (!client) return false
  try {
    await client.shutdown(options.shutdownTimeoutMs ?? 3000)
    return true
  } catch (error) {
    logger.error('[posthog] Failed to flush server events:', error)
    return false
  }
}

export interface PurchaseIdentity {
  userId: string | null
  appPlanId: AppPlanId | null
}

/**
 * Work out who paid. The first checkout carries `supabase_user_id` in the
 * payment metadata; Whop renewals may not, so fall back to our own
 * subscription row for the membership.
 */
export async function resolvePurchaseIdentity(
  input: {
    metadataUserId: string | null
    metadataPlanId: string | null
    configuredPlanId: AppPlanId | null
    membershipId: string | null
  },
  lookupByMembership: (membershipId: string) => Promise<{ user_id: string; plan_id: string } | null>
): Promise<PurchaseIdentity> {
  const asPlan = (value: string | null | undefined): AppPlanId | null =>
    value === 'core' || value === 'premium' ? value : null

  let userId = input.metadataUserId
  let appPlanId = asPlan(input.metadataPlanId) ?? input.configuredPlanId

  if ((!userId || !appPlanId) && input.membershipId) {
    const row = await lookupByMembership(input.membershipId)
    if (row) {
      userId = userId ?? row.user_id
      appPlanId = appPlanId ?? asPlan(row.plan_id)
    }
  }
  return { userId, appPlanId }
}
