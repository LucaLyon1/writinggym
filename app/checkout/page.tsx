import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  BILLING_PLANS,
  isBillingPlanKey,
  isConfiguredBillingPlan,
} from '@/lib/billing-plans'
import { WhopCheckoutClient } from './WhopCheckoutClient'
import styles from './checkout.module.css'

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; state_id?: string }>
}) {
  const params = await searchParams
  if (!isBillingPlanKey(params.plan)) redirect('/pricing')

  const plan = BILLING_PLANS[params.plan]
  if (!isConfiguredBillingPlan(plan)) redirect('/pricing?unavailable=true')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const next = `/checkout?plan=${encodeURIComponent(plan.key)}`
    redirect(`/signup?next=${encodeURIComponent(next)}`)
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link href="/pricing" className={styles.back}>← Back to plans</Link>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>Secure checkout with Whop</p>
          <h1>Finish choosing<br /><em>{plan.label}</em></h1>
          <p>Your seven-day ProseLab trial remains separate from this subscription.</p>
        </div>
        <WhopCheckoutClient
          email={user.email ?? ''}
          planKey={plan.key}
          planId={plan.whopPlanId}
          planLabel={plan.label}
          stateId={params.state_id}
        />
        <p className={styles.finePrint}>
          Payment and subscription management are securely handled by Whop.
        </p>
      </div>
    </main>
  )
}
