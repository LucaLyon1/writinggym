import { NextRequest, NextResponse } from 'next/server'
import type { UnwrapWebhookEvent } from '@whop/sdk/resources/webhooks'
import { getBillingPlanByWhopId } from '@/lib/billing-plans'
import { getPostHogClient } from '@/lib/posthog-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getWhopBillingPortalUrl, getWhopClient, WHOP_ACCOUNT_ID } from '@/lib/whop'
import {
  normalizeWhopMembership,
  syncWhopSubscription,
} from '@/lib/whop-subscription-sync'

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

  const posthog = getPostHogClient()
  posthog.capture({
    distinctId: userId,
    event: event.type === 'membership.activated'
      ? 'subscription_activated'
      : 'subscription_updated',
    properties: {
      provider: 'whop',
      plan_id: planId,
      whop_plan_id: membership.plan.id,
      whop_membership_id: membership.id,
      status: membership.status,
      cancel_at_period_end: membership.cancel_at_period_end,
    },
  })
  await posthog.shutdown()
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

  const posthog = getPostHogClient()
  posthog.capture({
    distinctId: subscription.user_id,
    event: 'subscription_payment_failed',
    properties: {
      provider: 'whop',
      plan_id: subscription.plan_id,
      whop_membership_id: membershipId,
      whop_payment_id: event.data.id,
      failure_message: event.data.failure_message,
    },
  })
  await posthog.shutdown()
}

async function handleSuccessfulPayment(
  event: Extract<UnwrapWebhookEvent, { type: 'payment.succeeded' }>
) {
  const payment = event.data
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

export async function POST(request: NextRequest) {
  if (!process.env.WHOP_WEBHOOK_SECRET || !process.env.WHOP_API_KEY) {
    console.error('[whop webhook] Whop secrets are not configured')
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 500 })
  }

  const body = await request.text()
  let event: UnwrapWebhookEvent

  try {
    event = getWhopClient().webhooks.unwrap(body, {
      headers: Object.fromEntries(request.headers.entries()),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid signature'
    console.error('[whop webhook] Signature verification failed:', message)
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  if (event.company_id && event.company_id !== WHOP_ACCOUNT_ID) {
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
