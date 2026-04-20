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
      '1 session per day',
      'Full rewrite + side-by-side comparison',
      'Browse the full extract library',
    ],
    cta: 'Get started free',
    ctaHref: '/signup',
    isPopular: false,
  },
  {
    id: 'core',
    label: 'Core',
    price: '$12/month',
    features: [
      '7-day free trial — cancel anytime',
      'Unlimited sessions',
      'AI analysis of every rewrite',
      'Detailed feedback — strong points, weak points, and what to try next',
      'Personal practice record',
      'Follow-up chat after every analysis',
      'Structured session mode with focus axes',
      'Full extract library',
    ],
    cta: 'Start 7-day free trial',
    lookupKey: 'core',
    product: 'core',
    mode: 'subscription',
    useManagedPayments: true,
    trialDays: 7,
    isPopular: true,
  },
  {
    id: 'core-annual',
    label: 'Core — Annual',
    price: '$99/year',
    features: [
      '7-day free trial — cancel anytime',
      'Everything in Core',
      'Save $45 per year',
      'Choose your preferred voice for listening to text aloud',
    ],
    cta: 'Best value — save 37%',
    lookupKey: 'core-annual',
    product: 'core-annual',
    mode: 'subscription',
    useManagedPayments: true,
    trialDays: 7,
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
                  {plan.cta}
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
