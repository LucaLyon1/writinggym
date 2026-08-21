import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getPostHogClient } from '@/lib/posthog-server'
import { syncBillingContactForUser } from '@/lib/billing-contact-sync'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PRE_RELEASE_PRODUCTS = new Set(['yearly_99', 'monthly_9.99'])

function getSubscriptionPeriod(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0]
  return {
    current_period_start: new Date(item.current_period_start * 1000).toISOString(),
    current_period_end: new Date(item.current_period_end * 1000).toISOString(),
  }
}

function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  if (invoice.parent?.type === 'subscription_details') {
    return typeof invoice.parent.subscription_details?.subscription === 'string'
      ? invoice.parent.subscription_details.subscription
      : invoice.parent.subscription_details?.subscription?.id ?? null
  }
  return null
}

async function resolvePlanId(product: string): Promise<string | null> {
  const { data: planByLookupKey } = await supabaseAdmin
    .from('plans')
    .select('id')
    .eq('stripe_lookup_key', product)
    .maybeSingle()

  if (planByLookupKey) return planByLookupKey.id

  const { data: plan } = await supabaseAdmin
    .from('plans')
    .select('id')
    .ilike('label', product)
    .maybeSingle()

  if (plan) return plan.id

  const { data: planById } = await supabaseAdmin
    .from('plans')
    .select('id')
    .eq('id', product)
    .maybeSingle()

  return planById?.id ?? null
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(body, sig!, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[webhook] Signature verification failed:', message)
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    )
  }

  console.log(`[webhook] Received event: ${stripeEvent.type}`)

  const { data: processed } = await supabaseAdmin
    .from('billing_webhook_events')
    .select('id')
    .eq('id', stripeEvent.id)
    .maybeSingle()
  if (processed) return NextResponse.json({ received: true, duplicate: true })

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        await handleCheckoutCompleted(stripeEvent.data.object as Stripe.Checkout.Session)
        break
      }
      case 'checkout.session.async_payment_succeeded': {
        await handleCheckoutCompleted(stripeEvent.data.object as Stripe.Checkout.Session)
        break
      }
      case 'checkout.session.async_payment_failed': {
        await handleAsyncPaymentFailed(stripeEvent.data.object as Stripe.Checkout.Session)
        break
      }
      case 'customer.subscription.updated': {
        await handleSubscriptionUpdated(stripeEvent.data.object as Stripe.Subscription)
        break
      }
      case 'customer.subscription.deleted': {
        await handleSubscriptionDeleted(stripeEvent.data.object as Stripe.Subscription)
        break
      }
      case 'invoice.paid': {
        await handleInvoicePaid(stripeEvent.data.object as Stripe.Invoice)
        break
      }
      case 'invoice.payment_failed': {
        await handleInvoicePaymentFailed(stripeEvent.data.object as Stripe.Invoice)
        break
      }
      default:
        console.log(`[webhook] Unhandled event type: ${stripeEvent.type}`)
    }

    const { error } = await supabaseAdmin.from('billing_webhook_events').insert({
      id: stripeEvent.id,
      provider: 'stripe',
      event_type: stripeEvent.type,
    })
    if (error && error.code !== '23505') throw error
  } catch (err) {
    console.error('[webhook] Error processing event:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const product = session.metadata?.product
  console.log('[webhook] checkout.session.completed:', {
    mode: session.mode,
    product,
    client_reference_id: session.client_reference_id,
    metadata_user_id: session.metadata?.user_id,
    subscription: session.subscription,
    customer: session.customer,
  })

  if (session.mode !== 'subscription') {
    console.log('[webhook] Skipping — session mode is not subscription:', session.mode)
    return
  }

  const userId = session.client_reference_id || session.metadata?.user_id
  if (!userId) {
    console.error('[webhook] SKIP: No user_id in client_reference_id or metadata')
    return
  }

  if (!product) {
    console.error('[webhook] SKIP: No product in session metadata')
    return
  }

  const planId = await resolvePlanId(product)
  if (!planId) {
    console.error(`[webhook] SKIP: No plan found in DB for product "${product}". Check your plans table.`)
    return
  }

  const stripeSubscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : (session.subscription as Stripe.Subscription)?.id

  if (!stripeSubscriptionId) {
    console.error('[webhook] SKIP: No subscription ID in checkout session')
    return
  }

  console.log('[webhook] Retrieving Stripe subscription:', stripeSubscriptionId)
  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
  const period = getSubscriptionPeriod(subscription)

  const stripeCustomerId = typeof session.customer === 'string'
    ? session.customer
    : (session.customer as Stripe.Customer)?.id ?? null

  const upsertData = {
    user_id: userId,
    plan_id: planId,
    status: subscription.status,
    stripe_subscription_id: stripeSubscriptionId,
    stripe_customer_id: stripeCustomerId,
    current_period_start: period.current_period_start,
    current_period_end: period.current_period_end,
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }
  console.log('[webhook] Upserting subscription:', upsertData)

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(upsertData, { onConflict: 'user_id' })

  if (error) {
    throw new Error(`Supabase subscription upsert failed: ${error.message}`)
  }

  await syncBillingContactForUser({ userId, status: subscription.status })

  console.log(`[webhook] Subscription saved for user ${userId}, plan ${planId}, status ${subscription.status}`)
  const posthog = getPostHogClient()
  posthog.capture({
    distinctId: userId,
    event: 'subscription_activated',
    properties: {
      plan_id: planId,
      product,
      status: subscription.status,
      stripe_subscription_id: stripeSubscriptionId,
      customer_email: session.customer_details?.email ?? null,
    },
  })
  await posthog.shutdown()

  if (PRE_RELEASE_PRODUCTS.has(product)) {
    const { error: badgeError } = await supabaseAdmin
      .from('profiles')
      .update({ is_founding_member: true })
      .eq('id', userId)
    if (badgeError) {
      console.error('[webhook] Failed to set founding member badge:', badgeError.message)
    } else {
      console.log(`[webhook] Founding member badge set for user ${userId}`)
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { data: existing } = await supabaseAdmin
    .from('subscriptions')
    .select('id, user_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  if (!existing) {
    console.log(`[webhook] No local subscription for stripe ID: ${subscription.id}`)
    return
  }

  const productMetadata = subscription.metadata?.product
  let planId: string | undefined
  if (productMetadata) {
    planId = (await resolvePlanId(productMetadata)) ?? undefined
  }

  const period = getSubscriptionPeriod(subscription)
  const updateData: Record<string, unknown> = {
    status: subscription.status,
    current_period_start: period.current_period_start,
    current_period_end: period.current_period_end,
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }

  if (planId) {
    updateData.plan_id = planId
  }

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update(updateData)
    .eq('id', existing.id)

  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`)
  }

  await syncBillingContactForUser({
    userId: existing.user_id,
    status: subscription.status,
  })
  console.log(`[webhook] Subscription updated for user ${existing.user_id}: status=${subscription.status}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { data: existing } = await supabaseAdmin
    .from('subscriptions')
    .select('id, user_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  if (!existing) {
    console.log(`[webhook] No local subscription for stripe ID: ${subscription.id}`)
    return
  }

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id)

  if (error) {
    throw new Error(`Failed to cancel subscription: ${error.message}`)
  }

  await syncBillingContactForUser({ userId: existing.user_id, status: 'canceled' })

  console.log(`[webhook] Subscription canceled for user ${existing.user_id}`)
  const posthog = getPostHogClient()
  posthog.capture({
    distinctId: existing.user_id,
    event: 'subscription_canceled',
    properties: { stripe_subscription_id: subscription.id },
  })
  await posthog.shutdown()
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const stripeSubscriptionId = getSubscriptionIdFromInvoice(invoice)
  if (!stripeSubscriptionId) return

  const { data: existing } = await supabaseAdmin
    .from('subscriptions')
    .select('id, user_id')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle()

  if (!existing) {
    console.log(`[webhook] invoice.paid — no local subscription for ${stripeSubscriptionId}`)
    return
  }

  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
  const period = getSubscriptionPeriod(subscription)

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: period.current_period_start,
      current_period_end: period.current_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id)

  if (error) {
    throw new Error(`Failed to update subscription on invoice.paid: ${error.message}`)
  }

  await syncBillingContactForUser({
    userId: existing.user_id,
    status: subscription.status,
  })
  console.log(`[webhook] Subscription renewed for user ${existing.user_id}`)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const stripeSubscriptionId = getSubscriptionIdFromInvoice(invoice)
  if (!stripeSubscriptionId) return

  const { data: existing } = await supabaseAdmin
    .from('subscriptions')
    .select('id, user_id')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle()

  if (!existing) {
    console.log(`[webhook] invoice.payment_failed — no local subscription for ${stripeSubscriptionId}`)
    return
  }

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id)

  if (error) {
    console.error('[webhook] Failed to mark subscription past_due:', error)
  } else {
    console.log(`[webhook] Subscription marked past_due for user ${existing.user_id}`)
    const posthog = getPostHogClient()
    posthog.capture({
      distinctId: existing.user_id,
      event: 'invoice_payment_failed',
      properties: { stripe_subscription_id: stripeSubscriptionId },
    })
    await posthog.shutdown()
  }
}

async function handleAsyncPaymentFailed(session: Stripe.Checkout.Session) {
  console.log('[webhook] checkout.session.async_payment_failed:', {
    session_id: session.id,
    customer_email: session.customer_details?.email,
    product: session.metadata?.product,
  })

  const userId = session.client_reference_id || session.metadata?.user_id
  if (!userId) return

  const { data: existing } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing) return

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'incomplete',
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id)

  if (error) {
    console.error('[webhook] Failed to mark subscription incomplete:', error)
  } else {
    console.log(`[webhook] Subscription marked incomplete for user ${userId} (async payment failed)`)
  }
}
