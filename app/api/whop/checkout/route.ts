import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  BILLING_PLANS,
  isBillingPlanKey,
  isConfiguredBillingPlan,
} from '@/lib/billing-plans'
import { getWhopClient, WHOP_ACCOUNT_ID } from '@/lib/whop'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as {
    planKey?: unknown
    attemptId?: unknown
  } | null

  if (!body || !isBillingPlanKey(body.planKey)) {
    return NextResponse.json({ error: 'Unknown billing plan' }, { status: 400 })
  }

  const plan = BILLING_PLANS[body.planKey]
  if (!isConfiguredBillingPlan(plan)) {
    return NextResponse.json({ error: 'This plan is not configured yet' }, { status: 503 })
  }

  // Let the embedded checkout render directly from the plan during local UI work.
  // Production must use a checkout configuration so Supabase identity metadata is
  // copied onto the resulting Whop membership and payment.
  if (!process.env.WHOP_API_KEY) {
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ mode: 'direct', planId: plan.whopPlanId })
    }
    return NextResponse.json({ error: 'Whop checkout is not configured' }, { status: 503 })
  }

  const siteUrl =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    request.nextUrl.origin
  const returnUrl = `${siteUrl}/checkout/complete?plan=${encodeURIComponent(plan.key)}`
  const attemptId = typeof body.attemptId === 'string' && body.attemptId.length <= 255
    ? body.attemptId
    : crypto.randomUUID()

  try {
    const checkout = await getWhopClient().checkoutConfigurations.create({
      account_id: WHOP_ACCOUNT_ID,
      mode: 'payment',
      plan_id: plan.whopPlanId,
      redirect_url: returnUrl,
      metadata: {
        supabase_user_id: user.id,
        app_plan_id: plan.appPlanId,
        billing_cycle: plan.billingCycle,
        app_email: user.email ?? null,
      },
      'Idempotency-Key': attemptId,
    })

    return NextResponse.json({
      mode: 'session',
      sessionId: checkout.id,
      planId: plan.whopPlanId,
    })
  } catch (error) {
    console.error('[whop checkout] Failed to create checkout configuration:', error)
    return NextResponse.json(
      { error: 'Unable to start Whop checkout' },
      { status: 502 }
    )
  }
}
