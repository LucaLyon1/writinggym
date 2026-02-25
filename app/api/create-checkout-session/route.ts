import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-expect-error – managed_payments_preview is in private preview
  apiVersion: '2026-01-28.clover; managed_payments_preview=v1',
})

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers })
}

export async function POST(request: NextRequest) {
  if (request.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method Not Allowed' },
      { status: 405, headers }
    )
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const {
      lookupKey,
      priceId,
      quantity = 1,
      successPath,
      cancelPath,
      product,
      mode = 'payment',
      useManagedPayments = true,
      trialDays,
    } = body

    if (!lookupKey && !priceId) {
      return NextResponse.json(
        { error: 'Lookup key or price ID is required' },
        { status: 400, headers }
      )
    }

    const siteUrl =
      process.env.SITE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://yourdomain.com'

    const successUrl = successPath
      ? `${siteUrl}${successPath}?session_id={CHECKOUT_SESSION_ID}`
      : `${siteUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelBase = cancelPath ? `${siteUrl}${cancelPath}` : `${siteUrl}/pricing`
    const cancelUrl = cancelBase.includes('?')
      ? `${cancelBase}&canceled=true`
      : `${cancelBase}?canceled=true`

    let finalPriceId = priceId

    if (lookupKey) {
      const prices = await stripe.prices.list({
        lookup_keys: [lookupKey],
        limit: 1,
      })

      if (prices.data.length === 0) {
        return NextResponse.json(
          {
            error: 'Price not found',
            message: `No price found with lookup key: ${lookupKey}`,
          },
          { status: 400, headers }
        )
      }

      finalPriceId = prices.data[0].id
    }

    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      mode: mode as 'payment' | 'subscription',
      line_items: [
        {
          price: finalPriceId,
          quantity,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        source: lookupKey || 'purchase',
        product: product || lookupKey || 'unknown',
        timestamp: new Date().toISOString(),
        ...(user ? { user_id: user.id } : {}),
      },
    }

    if (user) {
      sessionOptions.client_reference_id = user.id
      sessionOptions.customer_email = user.email
    }

    if (useManagedPayments) {
      // @ts-expect-error – managed_payments is in private preview
      sessionOptions.managed_payments = { enabled: true }
    } else {
      sessionOptions.automatic_tax = { enabled: true }
    }

    if (mode === 'subscription' && trialDays) {
      sessionOptions.subscription_data = {
        trial_period_days: trialDays,
        metadata: {
          product: product || lookupKey || 'unknown',
          ...(user ? { user_id: user.id } : {}),
        },
      }
    }

    const session = await stripe.checkout.sessions.create(sessionOptions)

    return NextResponse.json(
      {
        sessionCode: session.id,
        url: session.url,
      },
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Stripe error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        message,
      },
      { status: 500, headers }
    )
  }
}
