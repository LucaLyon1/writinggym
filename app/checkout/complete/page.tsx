import Link from 'next/link'
import { RefreshLayoutAfterPurchase } from '@/app/pricing/success/RefreshLayoutAfterPurchase'
import { BILLING_PLANS, isBillingPlanKey } from '@/lib/billing-plans'
import styles from '../checkout.module.css'

export default async function CheckoutCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; status?: string; receipt?: string }>
}) {
  const params = await searchParams
  const plan = isBillingPlanKey(params.plan) ? BILLING_PLANS[params.plan] : null
  const failed = params.status === 'error'

  return (
    <main className={styles.page}>
      {!failed && <RefreshLayoutAfterPurchase whopReceiptId={params.receipt} />}
      <div className={`${styles.shell} ${styles.complete}`}>
        <p className={styles.eyebrow}>{failed ? 'Checkout interrupted' : 'You’re in'}</p>
        <h1>
          {failed ? 'Payment wasn’t completed' : 'Welcome to'}
          {!failed && <><br /><em>{plan?.label ?? 'ProseLab'}</em></>}
        </h1>
        <p>
          {failed
            ? 'Nothing has been charged. Return to checkout whenever you’re ready.'
            : 'Whop is confirming your membership. Your paid features will appear automatically.'}
        </p>
        <div className={styles.actions}>
          {failed ? (
            <Link href={plan ? `/checkout?plan=${plan.key}` : '/pricing'}>Try checkout again</Link>
          ) : (
            <Link href="/">Start writing</Link>
          )}
          <Link href="/profile/settings" className={styles.secondary}>Account settings</Link>
        </div>
      </div>
    </main>
  )
}
