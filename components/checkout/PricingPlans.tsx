'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckoutButton } from './CheckoutButton'

interface PricingPlan {
  id: string
  label: string
  price: string
  features: string[]
  cta: string
  ctaHref?: string
  lookupKey?: string
  product?: string
  mode?: 'payment' | 'subscription'
  useManagedPayments?: boolean
  trialDays?: number
  isPopular?: boolean
}

const PLANS: PricingPlan[] = [
  {
    id: 'free',
    label: 'Free',
    price: 'Free',
    features: [
      'Unlimited submissions',
      '5 analyses per week',
      'Restricted extracts access',
    ],
    cta: 'Get started free',
    ctaHref: '/signup',
    isPopular: false,
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
    lookupKey: 'core',
    product: 'core',
    mode: 'subscription',
    useManagedPayments: true,
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
    lookupKey: 'premium',
    product: 'premium',
    mode: 'subscription',
    useManagedPayments: true,
    isPopular: false,
  },
]

interface PricingPlansProps {
  currentPlanId?: string | null
}

export function PricingPlans({ currentPlanId }: PricingPlansProps) {
  const [showCanceled, setShowCanceled] = useState(false)

  const isCurrentPlan = (planId: string) => {
    if (!currentPlanId && planId === 'free') return true
    return currentPlanId === planId
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('canceled') === 'true') {
      setShowCanceled(true)
      const timer = setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname)
        setShowCanceled(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <>
      {showCanceled && (
        <div
          id="checkout-canceled"
          className="plans-note"
          role="alert"
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            background: 'var(--plans-aged)',
            borderRadius: 'var(--radius)',
            color: 'var(--plans-rust)',
          }}
        >
          Checkout was canceled. You can try again when you&apos;re ready.
        </div>
      )}
      <section className="plans-grid" aria-label="Available plans">
        {PLANS.map((plan) => {
          const isCurrent = isCurrentPlan(plan.id)
          return (
            <article
              key={plan.id}
              className={`plans-card ${plan.isPopular && !isCurrent ? 'plans-card-popular' : ''} ${isCurrent ? 'plans-card-current' : ''}`}
            >
              {isCurrent && (
                <span className="plans-badge plans-badge-current">Your plan</span>
              )}
              {plan.isPopular && !isCurrent && (
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

              {isCurrent ? (
                <div className="plans-card-cta">
                  <span className="plans-btn plans-btn-current" aria-disabled="true">
                    Current plan
                  </span>
                </div>
              ) : plan.lookupKey && plan.product ? (
                <CheckoutButton
                  lookupKey={plan.lookupKey}
                  product={plan.product}
                  mode={plan.mode ?? 'subscription'}
                  useManagedPayments={plan.useManagedPayments}
                  trialDays={plan.trialDays}
                  successPath="/pricing/success"
                  cancelPath="/pricing"
                  className={
                    plan.id === 'free'
                      ? 'plans-btn plans-btn-outline'
                      : 'plans-btn plans-btn-primary'
                  }
                >
                  {plan.trialDays
                    ? `START ${plan.trialDays}-DAY FREE TRIAL`
                    : plan.cta}
                </CheckoutButton>
              ) : (
                <div className="plans-card-cta">
                  <Link
                    href={plan.ctaHref ?? '/signup'}
                    className={
                      plan.id === 'free'
                        ? 'plans-btn plans-btn-outline'
                        : 'plans-btn plans-btn-primary'
                    }
                  >
                    {plan.cta}
                  </Link>
                </div>
              )}
            </article>
          )
        })}
      </section>
    </>
  )
}
