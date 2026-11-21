import { NextRequest, NextResponse } from 'next/server'
import type { UnwrapWebhookEvent } from '@whop/sdk/resources/webhooks'
import { getBillingPlanByWhopId } from '@/lib/billing-plans'
import {
  buildMembershipEvents,
  buildPurchaseEvents,
  deterministicUuid,
  resolvePurchaseIdentity,
} from '@/lib/billing-analytics'
import { captureServerEvents } from '@/lib/posthog-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  getWhopBillingPortalUrl,
  getWhopClient,
  verifyWhopWebhook,
  WHOP_ACCOUNT_ID,
} from '@/lib/whop'
import {
  normalizeWhopMembership,
  syncWhopSubscription,
} from '@/lib/whop-subscription-sync'
import { syncBillingContactForUser } from '@/lib/billing-contact-sync'
import {
  handleWhopRefund,
  isStaleReactivation,
  REFUND_REVOKED_STATUS,
  type SubscriptionsTable,
  type WhopRefundPayment,
} from '@/lib/whop-refund'

type MembershipEvent = Extract<
  UnwrapWebhookEvent,
  { type: 'membership.activated' | 'membership.deactivated' | 'membership.cancel_at_period_end_changed' }
>

function metadataString(
  metadata: { [key: string]: unknown } | null,
  key: string
): string | null {
  const value = metadata?.[key]
  return typeof value === 'string' ? value : null
}

function resolveAppPlanId(event: MembershipEvent): 'core' | 'premium' | null {
  const membership = event.data
  const metadataPlan =
    metadataString(membership.metadata, 'app_plan_id') ??
    metadataString(membership.plan.metadata, 'app_plan_id')

  if (metadataPlan === 'core' || metadataPlan === 'premium') return metadataPlan
  return getBillingPlanByWhopId(membership.plan.id)?.appPlanId ?? null
}

async function syncMembership(event: MembershipEvent) {
  const membership = event.data
  const userId = metadataString(membership.metadata, 'supabase_user_id')
  const planId = resolveAppPlanId(event)

  if (!userId || !planId) {
    console.error('[whop webhook] Membership is missing app identity metadata', {
      membershipId: membership.id,
      userId,
      planId,
    })
    return
  }

  if (event.type === 'membership.cancel_at_period_end_changed') {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('subscriptions')
      .select('status')
      .eq('billing_provider', 'whop')
      .eq('external_subscription_id', membership.id)
      .maybeSingle()
    if (existingError) throw existingError
    if (isStaleReactivation(existing?.status, membership.status)) {
      console.warn('[whop webhook] Ignoring stale reactivation of a revoked membership', {
        membershipId: membership.id,
        existingStatus: existing?.status,
        incomingStatus: membership.status,
      })
      return
    }
  }

  // Capture before the database/contact sync so a later failure (for example
  // the Loops contact sync) cannot drop the analytics event. Deterministic
  // uuids mean Whop retries do not double count.
  await captureServerEvents(buildMembershipEvents({
    userId,
    webhookEventId: event.id,
    type: event.type,
    appPlanId: planId,
    whopPlanId: membership.plan.id,
    membershipId: membership.id,
    status: membership.status,
    cancelAtPeriodEnd: membership.cancel_at_period_end,
    interval: getBillingPlanByWhopId(membership.plan.id)?.billingCycle ?? null,
    occurredAt: membership.updated_at ?? event.timestamp,
  }))

  await syncWhopSubscription({
    userId,
    planId,
    status: membership.status,
    membershipId: membership.id,
    customerId: membership.user?.id ?? null,
    externalPlanId: membership.plan.id,
    manageUrl: membership.manage_url,
    currentPeriodStart: membership.renewal_period_start,
    currentPeriodEnd: membership.renewal_period_end,
    cancelAtPeriodEnd: membership.cancel_at_period_end,
    canceledAt: membership.canceled_at,
    providerUpdatedAt: membership.updated_at,
  })
}

async function handleFailedPayment(
  event: Extract<UnwrapWebhookEvent, { type: 'payment.failed' }>
) {
  const membershipId = event.data.membership?.id
  if (!membershipId) return

  const { data: subscription, error } = await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'past_due', updated_at: new Date().toISOString() })
    .eq('billing_provider', 'whop')
    .eq('external_subscription_id', membershipId)
    .select('user_id, plan_id')
    .maybeSingle()

  if (error) throw error
  if (!subscription) return

  await captureServerEvents([{
    distinctId: subscription.user_id,
    event: 'subscription_payment_failed',
    uuid: deterministicUuid(`subscription_payment_failed:${event.id}`),
    properties: {
      provider: 'whop',
      plan_id: subscription.plan_id,
      whop_membership_id: membershipId,
      whop_payment_id: event.data.id,
      failure_message: event.data.failure_message,
      $set: { subscription_status: 'past_due' },
    },
  }])
}

/**
 * Send `purchase_completed` (and `subscription_renewed` for renewals) to
 * PostHog for a successful Whop payment. Runs before the entitlement sync and
 * never throws, so analytics cannot fail or be lost behind the webhook.
 */
async function trackSuccessfulPayment(
  payment: Extract<UnwrapWebhookEvent, { type: 'payment.succeeded' }>['data']
) {
  try {
    const configured = payment.plan?.id ? getBillingPlanByWhopId(payment.plan.id) : null
    const identity = await resolvePurchaseIdentity(
      {
        metadataUserId: metadataString(payment.metadata, 'supabase_user_id'),
        metadataPlanId: metadataString(payment.metadata, 'app_plan_id'),
        configuredPlanId: configured?.appPlanId ?? null,
        membershipId: payment.membership?.id ?? null,
      },
      async (membershipId) => {
        const { data, error } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id, plan_id')
          .eq('billing_provider', 'whop')
          .eq('external_subscription_id', membershipId)
          .maybeSingle()
        if (error) throw error
        return data
      }
    )
    if (!identity.userId) {
      console.warn('[whop webhook] Purchase not sent to PostHog: no app user for payment', {
        paymentId: payment.id,
        membershipId: payment.membership?.id,
      })
      return
    }
    await captureServerEvents(buildPurchaseEvents({
      userId: identity.userId,
      payment,
      appPlanId: identity.appPlanId,
      interval: configured?.billingCycle ?? null,
      source: 'whop_webhook',
    }))
  } catch (error) {
    console.error('[whop webhook] Failed to track purchase in PostHog:', error)
  }
}

async function handleSuccessfulPayment(
  event: Extract<UnwrapWebhookEvent, { type: 'payment.succeeded' }>
) {
  const payment = event.data
  await trackSuccessfulPayment(payment)

  const userId = metadataString(payment.metadata, 'supabase_user_id')
  if (!userId || !payment.membership?.id) {
    console.error('[whop webhook] Successful payment is missing app identity metadata', {
      paymentId: payment.id,
      membershipId: payment.membership?.id,
      userId,
    })
    return
  }

  const membership = await getWhopClient().memberships.retrieve(payment.membership.id)
  const normalized = normalizeWhopMembership(membership, {
    customerId: payment.user?.id ?? null,
    updatedAt: payment.updated_at,
  })
  const metadataPlan =
    metadataString(normalized.metadata, 'app_plan_id') ??
    metadataString(payment.metadata, 'app_plan_id')
  const configuredPlan = getBillingPlanByWhopId(normalized.planId)
  const planId = metadataPlan === 'core' || metadataPlan === 'premium'
    ? metadataPlan
    : configuredPlan?.appPlanId

  if (!planId) {
    console.error('[whop webhook] Successful payment has an unknown plan', {
      paymentId: payment.id,
      membershipId: normalized.id,
      whopPlanId: normalized.planId,
    })
    return
  }

  await syncWhopSubscription({
    userId,
    planId,
    status: normalized.status,
    membershipId: normalized.id,
    customerId: normalized.customerId,
    externalPlanId: normalized.planId,
    manageUrl: normalized.manageUrl ?? getWhopBillingPortalUrl(payment.member?.id),
    currentPeriodStart: normalized.currentPeriodStart,
    currentPeriodEnd: normalized.currentPeriodEnd,
    cancelAtPeriodEnd: normalized.cancelAtPeriodEnd,
    canceledAt: normalized.canceledAt,
    providerUpdatedAt: normalized.providerUpdatedAt,
  })
}

async function handleRefund(
  event: Extract<UnwrapWebhookEvent, { type: 'refund.created' | 'refund.updated' }>
) {
  const outcome = await handleWhopRefund(event.data, {
    subscriptions: supabaseAdmin.from('subscriptions') as unknown as SubscriptionsTable,
    retrievePayment: async (id) =>
      (await getWhopClient().payments.retrieve(id)) as unknown as WhopRefundPayment,
    onRevoked: async ({ userId, planId, membershipId, paymentId, refundId }) => {
      // Same downstream path as membership.deactivated: Resend/Loops drop to free.
      await syncBillingContactForUser({ userId, status: REFUND_REVOKED_STATUS, planId })
      await captureServerEvents([{
        distinctId: userId,
        event: 'subscription_canceled',
        uuid: deterministicUuid(`subscription_canceled:refund:${refundId}`),
        properties: {
          provider: 'whop',
          reason: 'refund',
          plan_id: planId,
          whop_membership_id: membershipId,
          whop_payment_id: paymentId,
          whop_refund_id: refundId,
          status: REFUND_REVOKED_STATUS,
          $set: { subscription_status: REFUND_REVOKED_STATUS, is_paying_customer: false },
        },
      }])
    },
  })
  if (outcome.action === 'ignored') {
    console.info('[whop webhook] Refund did not revoke access', {
      refundId: event.data.id,
      reason: outcome.reason,
    })
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.WHOP_WEBHOOK_SECRET || !process.env.WHOP_API_KEY) {
    console.error('[whop webhook] Whop secrets are not configured')
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 500 })
  }

  const body = await request.text()
  let event: UnwrapWebhookEvent

  try {
    event = verifyWhopWebhook(body, request.headers)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid signature'
    console.error('[whop webhook] Signature verification failed:', message)
    console.error(
      '[whop webhook] Hint: WHOP_WEBHOOK_SECRET must be the raw dashboard Secret (ws_…)'
    )
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  // Newer Whop payloads may pin account_id; API version 2026-08-13 still uses company_id.
  const accountId =
    'account_id' in event
      ? ((event as UnwrapWebhookEvent & { account_id?: string | null }).account_id ?? null)
      : null
  const companyId = event.company_id ?? null
  const presentIds = [companyId, accountId].filter(
    (id): id is string => typeof id === 'string' && id.length > 0
  )
  if (presentIds.length > 0 && !presentIds.includes(WHOP_ACCOUNT_ID)) {
    console.error('[whop webhook] account mismatch', {
      expected: WHOP_ACCOUNT_ID,
      actual: { company_id: companyId, account_id: accountId },
      eventId: event.id,
      eventType: event.type,
    })
    return NextResponse.json({ error: 'Unexpected Whop account' }, { status: 403 })
  }

  const { data: processed } = await supabaseAdmin
    .from('billing_webhook_events')
    .select('id')
    .eq('id', event.id)
    .maybeSingle()
  if (processed) return NextResponse.json({ received: true, duplicate: true })

  try {
    switch (event.type) {
      case 'membership.activated':
      case 'membership.deactivated':
      case 'membership.cancel_at_period_end_changed':
        await syncMembership(event)
        break
      case 'payment.succeeded':
        await handleSuccessfulPayment(event)
        break
      case 'payment.failed':
        await handleFailedPayment(event)
        break
      case 'refund.created':
      case 'refund.updated':
        await handleRefund(event)
        break
      default:
        break
    }

    const { error } = await supabaseAdmin.from('billing_webhook_events').insert({
      id: event.id,
      provider: 'whop',
      event_type: event.type,
    })
    if (error && error.code !== '23505') throw error
  } catch (error) {
    console.error('[whop webhook] Event processing failed:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
