import { NextRequest, NextResponse } from 'next/server'
import { getBillingPlanByWhopId } from '@/lib/billing-plans'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getWhopClient, WHOP_ACCOUNT_ID, WHOP_PRODUCT_ID } from '@/lib/whop'
import { syncWhopSubscription } from '@/lib/whop-subscription-sync'

function metadataString(
  metadata: { [key: string]: unknown } | null,
  key: string
): string | null {
  const value = metadata?.[key]
  return typeof value === 'string' ? value : null
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as { receiptId?: unknown } | null
  if (!body || typeof body.receiptId !== 'string' || !/^pay_[A-Za-z0-9]+$/.test(body.receiptId)) {
    return NextResponse.json({ error: 'Invalid Whop receipt' }, { status: 400 })
  }

  try {
    const whop = getWhopClient()
    const payment = await whop.payments.retrieve(body.receiptId)

    if (payment.company?.id !== WHOP_ACCOUNT_ID || payment.product?.id !== WHOP_PRODUCT_ID) {
      return NextResponse.json({ error: 'Unexpected Whop purchase' }, { status: 403 })
    }

    if (payment.status !== 'paid' || payment.substatus !== 'succeeded') {
      return NextResponse.json({ error: 'Payment is not complete yet' }, { status: 409 })
    }

    const metadataUserId = metadataString(payment.metadata, 'supabase_user_id')
    if (metadataUserId !== user.id) {
      return NextResponse.json({ error: 'Receipt does not belong to this account' }, { status: 403 })
    }

    if (!payment.membership?.id || !payment.plan?.id) {
      return NextResponse.json({ error: 'Membership is not ready yet' }, { status: 409 })
    }

    const membership = await whop.memberships.retrieve(payment.membership.id)
    if (membership.company.id !== WHOP_ACCOUNT_ID || membership.product.id !== WHOP_PRODUCT_ID) {
      return NextResponse.json({ error: 'Unexpected Whop membership' }, { status: 403 })
    }

    const membershipUserId = metadataString(membership.metadata, 'supabase_user_id')
    if (membershipUserId && membershipUserId !== user.id) {
      return NextResponse.json({ error: 'Membership does not belong to this account' }, { status: 403 })
    }

    const metadataPlan =
      metadataString(membership.metadata, 'app_plan_id') ??
      metadataString(payment.metadata, 'app_plan_id')
    const configuredPlan = getBillingPlanByWhopId(membership.plan.id)
    const planId = metadataPlan === 'core' || metadataPlan === 'premium'
      ? metadataPlan
      : configuredPlan?.appPlanId

    if (!planId || membership.plan.id !== payment.plan.id) {
      return NextResponse.json({ error: 'Unknown Whop plan' }, { status: 422 })
    }

    await syncWhopSubscription({
      userId: user.id,
      planId,
      status: membership.status,
      membershipId: membership.id,
      customerId: membership.user?.id ?? payment.user?.id ?? null,
      externalPlanId: membership.plan.id,
      manageUrl: membership.manage_url,
      currentPeriodStart: membership.renewal_period_start,
      currentPeriodEnd: membership.renewal_period_end,
      cancelAtPeriodEnd: membership.cancel_at_period_end,
      canceledAt: membership.canceled_at,
      providerUpdatedAt: membership.updated_at,
    })

    const { error: ledgerError } = await supabaseAdmin
      .from('billing_webhook_events')
      .upsert({
        id: `checkout:${payment.id}`,
        provider: 'whop',
        event_type: 'checkout.reconciled',
      }, { onConflict: 'id', ignoreDuplicates: true })
    if (ledgerError) throw ledgerError

    return NextResponse.json({ synced: true, planId, status: membership.status })
  } catch (error) {
    console.error('[whop checkout sync] Failed to reconcile receipt:', error)
    return NextResponse.json({ error: 'Unable to confirm purchase yet' }, { status: 502 })
  }
}
