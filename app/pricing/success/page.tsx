import Link from 'next/link'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PRODUCT_LABELS: Record<string, string> = {
  core: 'Core',
  premium: 'Premium',
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
      planLabel = product ? PRODUCT_LABELS[product] ?? product : null
      customerEmail = session.customer_details?.email ?? null
    } catch {
      // Session retrieval failed — show generic success
    }
  }

  return (
    <div className="plans-root">
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
          <Link href="/lab" className="plans-btn plans-btn-primary">
            Start writing
          </Link>
          <Link href="/profile" className="plans-btn plans-btn-outline">
            View your profile
          </Link>
        </div>
      </div>
    </div>
  )
}
