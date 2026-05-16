'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import posthog from 'posthog-js'
import { CheckoutButton } from './CheckoutButton'

type BillingCycle = 'yearly' | 'monthly'

interface PricingPlan {
  id: string
  label: string
  price: string
  priceNote?: string
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

const FREE_PLAN: PricingPlan = {
  id: 'free',
  label: 'Free',
  price: 'Free',
  features: [
    '1 session per day',
    'Full rewrite + side-by-side comparison',
    'Browse the full extract library',
  ],
  cta: 'Get started',
  ctaHref: '/signup',
  isPopular: false,
}

const PRO_PLANS: Record<BillingCycle, PricingPlan> = {
  yearly: {
    id: 'pre-release-yearly',
    label: 'ProseLab Core',
    price: '$8.25',
    priceNote: 'Billed $99 annually — save 17%',
    features: [
      'Unlimited sessions',
      'AI analysis on every rewrite',
      'Full extract library',
      'Follow-up chat after every analysis',
      'Cancel anytime',
    ],
    cta: 'Get ProseLab Core',
    lookupKey: 'yearly_99',
    product: 'yearly_99',
    mode: 'subscription',
    useManagedPayments: true,
    isPopular: true,
  },
  monthly: {
    id: 'pre-release-monthly',
    label: 'ProseLab Core',
    price: '$9.99',
    priceNote: 'Billed monthly',
    features: [
      'Unlimited sessions',
      'AI analysis on every rewrite',
      'Full extract library',
      'Follow-up chat after every analysis',
      'Cancel anytime',
    ],
    cta: 'Get ProseLab Core',
    lookupKey: 'monthly_9.99',
    product: 'monthly_9.99',
    mode: 'subscription',
    useManagedPayments: true,
    isPopular: true,
  },
}

interface PricingPlansProps {
  currentPlanId?: string | null
}

export function PricingPlans({ currentPlanId }: PricingPlansProps) {
  const [showCanceled, setShowCanceled] = useState(false)
  const [billing, setBilling] = useState<BillingCycle>('yearly')

  const proPlan = PRO_PLANS[billing]
  const plans = [proPlan]

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

      <div className="plans-toggle-wrap">
        <button
          type="button"
          className={`plans-toggle-label${billing === 'yearly' ? ' plans-toggle-label-active' : ''}`}
          onClick={() => { setBilling('yearly'); posthog.capture('billing_cycle_toggled', { cycle: 'yearly' }) }}
          aria-pressed={billing === 'yearly'}
        >
          Yearly
          <span className="plans-toggle-badge">Save 17%</span>
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={billing === 'monthly'}
          aria-label="Toggle billing period"
          className="plans-toggle-switch"
          data-state={billing}
          onClick={() => {
            const next = billing === 'yearly' ? 'monthly' : 'yearly'
            setBilling(next)
            posthog.capture('billing_cycle_toggled', { cycle: next })
          }}
        >
          <span className="plans-toggle-thumb" aria-hidden />
        </button>
        <button
          type="button"
          className={`plans-toggle-label${billing === 'monthly' ? ' plans-toggle-label-active' : ''}`}
          onClick={() => { setBilling('monthly'); posthog.capture('billing_cycle_toggled', { cycle: 'monthly' }) }}
          aria-pressed={billing === 'monthly'}
        >
          Monthly
        </button>
      </div>

      <section className="plans-grid" aria-label="Available plans">
        {plans.map((plan) => {
          const isCurrent = isCurrentPlan(plan.id)
          return (
            <article
              key={plan.id}
              className={`plans-card ${plan.isPopular && !isCurrent ? 'plans-card-popular' : ''} ${isCurrent ? 'plans-card-current' : ''}`}
            >
              {isCurrent && (
                <span className="plans-badge plans-badge-current">Your plan</span>
              )}
              <div className="plans-card-header">
                <h2 className="plans-card-title">{plan.label}</h2>
                <p className="plans-card-price">
                  {plan.id === 'free' ? (
                    plan.price
                  ) : (
                    <>
                      {plan.price}
                      <span className="plans-card-price-unit"> / month</span>
                    </>
                  )}
                </p>
                {plan.priceNote && (
                  <p className="plans-card-price-note">{plan.priceNote}</p>
                )}
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
                  className="plans-btn plans-btn-primary"
                >
                  {plan.cta}
                </CheckoutButton>
              ) : (
                <div className="plans-card-cta">
                  <Link
                    href={plan.ctaHref ?? '/signup'}
                    className="plans-btn plans-btn-outline"
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
