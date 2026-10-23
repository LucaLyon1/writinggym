import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { MANAGEABLE_STATUSES, resolveBillingPortalTarget } from '@/lib/billing-portal'

// Built lazily: a module-level `new Stripe(undefined)` throws on import, which
// would 500 this route for Whop and comp users too, not just Stripe ones.
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // @ts-expect-error – managed_payments_preview is in private preview
    apiVersion: '2026-01-28.clover; managed_payments_preview=v1',
  })
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', message: 'Please sign in again to manage billing.' },
        { status: 401 }
      )
    }

    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('billing_provider, manage_url, stripe_customer_id')
      .eq('user_id', user.id)
      // past_due users must reach the portal too, so they can fix a failed card.
      .in('status', [...MANAGEABLE_STATUSES])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subscriptionError) throw subscriptionError

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found', message: 'We couldn’t find an active subscription on this account.' },
        { status: 404 }
      )
    }

    const target = resolveBillingPortalTarget(subscription)

    if (target.kind === 'whop') {
      return NextResponse.json({ url: target.url })
    }

    if (target.kind === 'none') {
      return NextResponse.json(
        { error: 'No billing account found', code: 'no_external_billing', message: target.message },
        { status: 409 }
      )
    }

    const siteUrl =
      process.env.SITE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://app.proselab.io'

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: target.customerId,
      return_url: `${siteUrl}/profile/settings`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('Portal session error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create portal session',
        message: 'We couldn’t open billing just now. Please try again, or email contact@proselab.io.',
      },
      { status: 500 }
    )
  }
}
