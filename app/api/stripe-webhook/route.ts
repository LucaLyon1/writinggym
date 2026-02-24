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

const PRODUCT_TO_PLAN_ID: Record<string, string> = {
  core: 'core',
  premium: 'premium',
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
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
    console.error('Webhook signature verification failed:', message)
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    )
  }

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
    }
  } catch (err) {
    console.error('Error processing webhook event:', err)
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const product = session.metadata?.product
  const tagId = product ? PRODUCT_TAGS[product] : undefined

  if (tagId) {
    const customerEmail = session.customer_details?.email
    if (customerEmail) {
      try {
        await addToConvertKitTag(customerEmail, tagId)
        console.log(`Added ${customerEmail} to ConvertKit tag ${tagId} for ${product}`)
      } catch (err) {
        console.error('Failed to add to ConvertKit:', err instanceof Error ? err.message : err)
      }
    }
  }

  if (session.mode !== 'subscription') return

  const userId = session.client_reference_id || session.metadata?.user_id
  if (!userId) {
    console.error('No user_id found in checkout session metadata or client_reference_id')
    return
  }

  const planId = product ? PRODUCT_TO_PLAN_ID[product] : null
  if (!planId) {
    console.error(`No plan mapping found for product: ${product}`)
    return
  }

  const stripeSubscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : (session.subscription as Stripe.Subscription)?.id

  if (!stripeSubscriptionId) {
    console.error('No subscription ID found in checkout session')
    return
  }

  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
  const stripeCustomerId = typeof session.customer === 'string'
    ? session.customer
    : (session.customer as Stripe.Customer)?.id ?? null

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        plan_id: planId,
        status: subscription.status,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (error) {
    console.error('Failed to upsert subscription:', error)
  } else {
    console.log(`Subscription created/updated for user ${userId}, plan ${planId}`)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { data: existing } = await supabaseAdmin
    .from('subscriptions')
    .select('id, user_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  if (!existing) {
    console.log(`No local subscription found for stripe ID: ${subscription.id}`)
    return
  }

  const productMetadata = subscription.metadata?.product
  const planId = productMetadata ? PRODUCT_TO_PLAN_ID[productMetadata] : undefined

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
    console.error('Failed to update subscription:', error)
  } else {
    console.log(`Subscription updated for user ${existing.user_id}: status=${subscription.status}`)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { data: existing } = await supabaseAdmin
    .from('subscriptions')
    .select('id, user_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  if (!existing) {
    console.log(`No local subscription found for stripe ID: ${subscription.id}`)
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
    console.error('Failed to mark subscription as canceled:', error)
  } else {
    console.log(`Subscription canceled for user ${existing.user_id}`)
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
