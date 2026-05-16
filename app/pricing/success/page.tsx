import Link from 'next/link'
import Stripe from 'stripe'
import { RefreshLayoutAfterPurchase } from './RefreshLayoutAfterPurchase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AppFooter } from '@/components/AppFooter'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

async function resolvePlanFromProduct(
  product: string
): Promise<{ id: string; label: string } | null> {
  const { data: planByLookupKey } = await supabaseAdmin
    .from('plans')
    .select('id, label')
    .eq('stripe_lookup_key', product)
    .maybeSingle()

  if (planByLookupKey) return planByLookupKey

  const { data: plan } = await supabaseAdmin
    .from('plans')
    .select('id, label')
    .ilike('label', product)
    .maybeSingle()

  if (plan) return plan

  const { data: planById } = await supabaseAdmin
    .from('plans')
    .select('id, label')
    .eq('id', product)
    .maybeSingle()

  return planById
}

async function ensureSubscription(
  session: Stripe.Checkout.Session,
  plan: { id: string } | null
) {
  if (session.mode !== 'subscription') return

  const userId = session.client_reference_id || session.metadata?.user_id
  if (!userId) return

  const { data: existing } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .maybeSingle()

  if (existing) return

  const product = session.metadata?.product
  if (!product || !plan) return

  const planId = plan.id

  const stripeSubscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : (session.subscription as Stripe.Subscription)?.id

  if (!stripeSubscriptionId) return

  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
  const item = subscription.items.data[0]
  const stripeCustomerId = typeof session.customer === 'string'
    ? session.customer
    : (session.customer as Stripe.Customer)?.id ?? null

  await supabaseAdmin
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        plan_id: planId,
        status: subscription.status,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId,
        current_period_start: new Date(item.current_period_start * 1000).toISOString(),
        current_period_end: new Date(item.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
}

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string }>
}

export default async function PricingSuccessPage({ searchParams }: SuccessPageProps) {
  const { session_id } = await searchParams
  let planLabel: string | null = null
  let customerEmail: string | null = null

  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id)
      const product = session.metadata?.product
      const plan = product ? await resolvePlanFromProduct(product) : null
      planLabel = plan?.label ?? null
      customerEmail = session.customer_details?.email ?? null

      await ensureSubscription(session, plan)
    } catch (err) {
      console.error('[success] Failed to verify session:', err)
    }
  }

  return (
    <div className="plans-root">
      {session_id ? <RefreshLayoutAfterPurchase /> : null}
      <div className="plans-inner">
        <Link href="/" className="plans-back-link">
          ← Back to home
        </Link>

        <header className="plans-header">
          <p className="plans-eyebrow">Success</p>
          <h1 className="plans-title">
            {planLabel ? (
              <>
                Welcome to
                <br />
                <em>{planLabel}!</em>
              </>
            ) : (
              <>
                Your purchase was
                <br />
                <em>successful!</em>
              </>
            )}
          </h1>
          <p className="plans-subtitle">
            {customerEmail
              ? `A confirmation email has been sent to ${customerEmail}.`
              : "You'll receive a confirmation email from Stripe shortly."}
            {' '}Your new features are available immediately.
          </p>
        </header>

        <div className="plans-success-actions">
          <Link href="/" className="plans-btn plans-btn-primary">
            Start writing
          </Link>
          <Link href="/profile" className="plans-btn plans-btn-outline">
            View your profile
          </Link>
        </div>
      </div>
      <AppFooter />
    </div>
  )
}
