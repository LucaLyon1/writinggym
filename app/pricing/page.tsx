import Link from 'next/link'

interface PricingPlan {
  id: string
  label: string
  price: string
  features: string[]
  cta: string
  ctaHref: string
  isPopular?: boolean
}

const PLANS: PricingPlan[] = [
  {
    id: 'free',
    label: 'Free',
    price: 'Free',
    features: [
      'Unlimited submissions',
      '5 analysis per week',
      'Restricted extracts access',
    ],
    cta: 'Get started free',
    ctaHref: '/signup',
  },
  {
    id: 'core',
    label: 'Core',
    price: '$12.99/month',
    features: [
      'Unlimited submissions',
      'Unlimited analysis',
      'Core extract library (buy as needed)',
      'Premium badge',
    ],
    cta: 'Upgrade to Core',
    ctaHref: '/signup',
    isPopular: true,
  },
  {
    id: 'premium',
    label: 'Premium',
    price: '$37.99/month',
    features: [
      'Everything in Core',
      'Full extract library — unlimited access',
      'Playground — practice with any text or extract you bring',
      'Choose your preferred voice for listening to text aloud',
    ],
    cta: 'Upgrade to Premium',
    ctaHref: '/signup',
  },
]

export default function PricingPage() {
  return (
    <div className="plans-root">
      <div className="plans-inner">
        <Link href="/" className="plans-back-link">
          ← Back to home
        </Link>

        <header className="plans-header">
          <p className="plans-eyebrow">Pricing</p>
          <h1 className="plans-title">
            Choose your
            <br />
            <em>plan</em>
          </h1>
          <p className="plans-subtitle">
            Start free and upgrade when you need unlimited analysis, extracts,
            and premium features.
          </p>
        </header>

        <section className="plans-grid" aria-label="Available plans">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`plans-card ${plan.isPopular ? 'plans-card-popular' : ''}`}
            >
              {plan.isPopular && (
                <span className="plans-badge">Most popular</span>
              )}
              <div className="plans-card-header">
                <h2 className="plans-card-title">{plan.label}</h2>
                <p className="plans-card-price">{plan.price}</p>
              </div>

              <ul className="plans-features" aria-label="Plan features">
                {plan.features.map((feature) => (
                  <li key={feature} className="plans-feature">
                    <span className="plans-feature-check" aria-hidden>
                      ✓
                    </span>
                    <span className="plans-feature-label">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="plans-card-cta">
                <Link
                  href={plan.ctaHref}
                  className={
                    plan.id === 'free'
                      ? 'plans-btn plans-btn-outline'
                      : 'plans-btn plans-btn-primary'
                  }
                >
                  {plan.cta}
                </Link>
              </div>
            </article>
          ))}
        </section>

        <p className="plans-note">
          All plans include AI craft analysis, feedback, and text-to-speech.
          No credit card required for the free tier.
        </p>
      </div>
    </div>
  )
}
