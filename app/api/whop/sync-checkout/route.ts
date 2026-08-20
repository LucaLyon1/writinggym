import { NextRequest, NextResponse } from 'next/server'
import { getBillingPlanByWhopId } from '@/lib/billing-plans'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  getWhopBillingPortalUrl,
  getWhopClient,
  WHOP_ACCOUNT_ID,
  WHOP_PRODUCT_ID,
} from '@/lib/whop'
import {
  normalizeWhopMembership,
  syncWhopSubscription,
} from '@/lib/whop-subscription-sync'

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
    const normalized = normalizeWhopMembership(membership, {
      customerId: payment.user?.id ?? null,
      updatedAt: payment.updated_at,
    })
    if (normalized.accountId !== WHOP_ACCOUNT_ID || normalized.productId !== WHOP_PRODUCT_ID) {
      return NextResponse.json({ error: 'Unexpected Whop membership' }, { status: 403 })
    }

    const membershipUserId = metadataString(normalized.metadata, 'supabase_user_id')
    if (membershipUserId && membershipUserId !== user.id) {
      return NextResponse.json({ error: 'Membership does not belong to this account' }, { status: 403 })
    }

    const metadataPlan =
      metadataString(normalized.metadata, 'app_plan_id') ??
      metadataString(payment.metadata, 'app_plan_id')
    const configuredPlan = getBillingPlanByWhopId(normalized.planId)
    const planId = metadataPlan === 'core' || metadataPlan === 'premium'
      ? metadataPlan
      : configuredPlan?.appPlanId

    if (!planId || normalized.planId !== payment.plan.id) {
      return NextResponse.json({ error: 'Unknown Whop plan' }, { status: 422 })
    }

    await syncWhopSubscription({
      userId: user.id,
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

    const { error: ledgerError } = await supabaseAdmin
      .from('billing_webhook_events')
      .upsert({
        id: `checkout:${payment.id}`,
        provider: 'whop',
        event_type: 'checkout.reconciled',
      }, { onConflict: 'id', ignoreDuplicates: true })
    if (ledgerError) throw ledgerError

    return NextResponse.json({ synced: true, planId, status: normalized.status })
  } catch (error) {
    console.error('[whop checkout sync] Failed to reconcile receipt:', error)
    return NextResponse.json({ error: 'Unable to confirm purchase yet' }, { status: 502 })
  }
}
