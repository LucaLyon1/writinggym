import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PRODUCT_TAGS: Record<string, string> = {
  vault: '14843035',
  upgrade: '14115500',
  core: '14115500',
  premium: '14115500',
  book: '14115500',
}

async function resolvePlanId(product: string): Promise<string | null> {
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

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        await handleCheckoutCompleted(stripeEvent.data.object as Stripe.Checkout.Session)
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
  } catch (err) {
    console.error('[webhook] Error processing event:', err)
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

  const tagId = product ? PRODUCT_TAGS[product] : undefined
  if (tagId) {
    const customerEmail = session.customer_details?.email
    if (customerEmail) {
      try {
        await addToConvertKitTag(customerEmail, tagId)
        console.log(`[webhook] Added ${customerEmail} to ConvertKit tag ${tagId}`)
      } catch (err) {
        console.error('[webhook] ConvertKit failed:', err instanceof Error ? err.message : err)
      }
    }
  }

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

  const stripeCustomerId = typeof session.customer === 'string'
    ? session.customer
    : (session.customer as Stripe.Customer)?.id ?? null

  const upsertData = {
    user_id: userId,
    plan_id: planId,
    status: subscription.status,
    stripe_subscription_id: stripeSubscriptionId,
    stripe_customer_id: stripeCustomerId,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }
  console.log('[webhook] Upserting subscription:', upsertData)

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(upsertData, { onConflict: 'user_id' })

  if (error) {
    console.error('[webhook] Supabase upsert FAILED:', JSON.stringify(error))
  } else {
    console.log(`[webhook] Subscription saved for user ${userId}, plan ${planId}, status ${subscription.status}`)
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

  const updateData: Record<string, unknown> = {
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
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
    console.error('[webhook] Failed to update subscription:', error)
  } else {
    console.log(`[webhook] Subscription updated for user ${existing.user_id}: status=${subscription.status}`)
  }
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
    console.error('[webhook] Failed to cancel subscription:', error)
  } else {
    console.log(`[webhook] Subscription canceled for user ${existing.user_id}`)
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const stripeSubscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : (invoice.subscription as Stripe.Subscription)?.id

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

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id)

  if (error) {
    console.error('[webhook] Failed to update subscription on invoice.paid:', error)
  } else {
    console.log(`[webhook] Subscription renewed for user ${existing.user_id}`)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const stripeSubscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : (invoice.subscription as Stripe.Subscription)?.id

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
  }
}

async function addToConvertKitTag(email: string, tagId: string): Promise<void> {
  const apiSecret = process.env.CONVERTKIT_API_SECRET

  if (!apiSecret) {
    throw new Error('CONVERTKIT_API_SECRET is not configured')
  }

  const response = await fetch(
    `https://api.convertkit.com/v3/tags/${tagId}/subscribe`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_secret: apiSecret,
        email,
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ConvertKit API error: ${response.status} - ${errorText}`)
  }
}
