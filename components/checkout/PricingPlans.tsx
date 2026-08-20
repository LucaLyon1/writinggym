'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import posthog from 'posthog-js'
import { CheckoutButton } from './CheckoutButton'
import { WhopCheckoutModal } from './WhopCheckoutModal'
import { isBillingPlanKey, type BillingPlanKey } from '@/lib/billing-plans'

type BillingCycle = 'yearly' | 'monthly'

const ACCENT_WORDS = new Set(['Core', 'Premium', 'VIP'])

function renderPlanTitle(label: string) {
  const parts = label.split(' ')
  return parts.map((word, i) => {
    const space = i < parts.length - 1 ? ' ' : ''
    if (ACCENT_WORDS.has(word)) {
      return (
        <span key={i} className="plans-card-title-accent">
          {word}
          {space}
        </span>
      )
    }
    return (
      <span key={i}>
        {word}
        {space}
      </span>
    )
  })
}

interface PricingPlan {
  id: string
  label: string
  price: string
  originalPrice?: string
  priceUnit?: string
  priceNote?: string
  features: string[]
  cta: string
  ctaHref?: string
  billingPlanKey?: BillingPlanKey
  isPopular?: boolean
  isDiscounted?: boolean
  isUnavailable?: boolean
  badge?: string
}

const CORE_FEATURES = [
  'Unlimited sessions',
  'AI analysis on every rewrite',
  'Follow-up chat after every analysis',
  'Cancel anytime',
]

const PREMIUM_FEATURES = [
  'Unlimited sessions',
  'AI analysis on every rewrite',
  'Full extract library — always',
  'Follow-up chat after every analysis',
  'Early access to new features',
  'Exclusive founder-member Discord access',
  'Cancel anytime',
]

const CORE_PLANS: Record<BillingCycle, PricingPlan> = {
  yearly: {
    id: 'pre-release-yearly',
    label: 'ProseLab Core',
    price: '$8.25',
    priceUnit: ' / month',
    priceNote: 'Billed $99 annually — save 17%',
    features: CORE_FEATURES,
    cta: 'Get ProseLab Core',
    billingPlanKey: 'core-yearly',
  },
  monthly: {
    id: 'pre-release-monthly',
    label: 'ProseLab Core',
    price: '$9.99',
    priceUnit: ' / month',
    priceNote: 'Billed monthly',
    features: CORE_FEATURES,
    cta: 'Get ProseLab Core',
    billingPlanKey: 'core-monthly',
  },
}

const PREMIUM_PLANS: Record<BillingCycle, PricingPlan> = {
  yearly: {
    id: 'premium-yearly',
    label: 'ProseLab Premium',
    price: '$8.25',
    originalPrice: '$16.50',
    priceUnit: ' / month',
    priceNote: 'Billed $99 annually — 50% off launch price',
    features: PREMIUM_FEATURES,
    cta: 'Get ProseLab Premium',
    billingPlanKey: 'premium-yearly',
    isDiscounted: true,
    badge: 'Early-Bird price',
  },
  monthly: {
    id: 'premium-monthly',
    label: 'ProseLab Premium',
    price: '$9.99',
    originalPrice: '$19.99',
    priceUnit: ' / month',
    priceNote: '50% off launch price',
    features: PREMIUM_FEATURES,
    cta: 'Get ProseLab Premium',
    billingPlanKey: 'premium-monthly',
    isDiscounted: true,
    badge: 'Early-Bird price',
  },
}

const VIP_PLAN: PricingPlan = {
  id: 'vip',
  label: 'ProseLab VIP',
  price: '$199',
  priceUnit: ' one-time',
  priceNote: 'Lifetime access — coming soon',
  features: [
    'Everything in Premium',
    'Lifetime access — no renewals',
    'Priority support',
    'Direct line to the team',
    'Early access to new features',
  ],
  cta: 'Coming soon',
  ctaHref: '#',
  isUnavailable: true,
}

interface PricingPlansProps {
  currentPlanId?: string | null
  userEmail?: string | null
  /** If true, render the Free card with a CTA that records the post-trial choice. */
  mustChooseAfterTrial?: boolean
}

export function PricingPlans({ currentPlanId, userEmail, mustChooseAfterTrial }: PricingPlansProps) {
  const [showCanceled, setShowCanceled] = useState(false)
  const [billing, setBilling] = useState<BillingCycle>('yearly')
  const [savingFreeChoice, setSavingFreeChoice] = useState(false)
  const [checkoutPlanKey, setCheckoutPlanKey] = useState<BillingPlanKey | null>(null)
  const [checkoutStateId, setCheckoutStateId] = useState<string | undefined>()

  const corePlan = CORE_PLANS[billing]
  const premiumPlan = PREMIUM_PLANS[billing]
  const plans = [corePlan, premiumPlan, VIP_PLAN]

  const isCurrentPlan = (planId: string) => {
    if (!currentPlanId && planId === 'free') return true
    return currentPlanId === planId
  }

  async function chooseFree() {
    setSavingFreeChoice(true)
    try {
      const res = await fetch('/api/profile/post-trial-choice', {
        method: 'POST',
      })
      if (res.ok) {
        posthog.capture('post_trial_chose_free')
        // Reload so the layout drops the paywall flag.
        window.location.href = '/'
      }
    } finally {
      setSavingFreeChoice(false)
    }
  }

  const openCheckout = useCallback((planKey: BillingPlanKey) => {
    if (userEmail === null) {
      const next = `/pricing?checkout=${encodeURIComponent(planKey)}`
      window.location.assign(`/signup?next=${encodeURIComponent(next)}`)
      return
    }

    // PricingPlans is also reused in account gates that do not have the user's
    // email available. Preserve their server-authenticated checkout handoff.
    if (!userEmail) {
      window.location.assign(`/checkout?plan=${encodeURIComponent(planKey)}`)
      return
    }

    setCheckoutPlanKey(planKey)
  }, [userEmail])

  const closeCheckout = useCallback(() => {
    setCheckoutPlanKey(null)
    setCheckoutStateId(undefined)

    const url = new URL(window.location.href)
    if (url.searchParams.has('checkout') || url.searchParams.has('state_id')) {
      url.searchParams.delete('checkout')
      url.searchParams.delete('state_id')
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requestedPlan = params.get('checkout')

    if (isBillingPlanKey(requestedPlan)) {
      if (userEmail === null) {
        const next = `/pricing?checkout=${encodeURIComponent(requestedPlan)}`
        window.location.replace(`/signup?next=${encodeURIComponent(next)}`)
        return
      }

      if (userEmail) {
        setBilling(requestedPlan.endsWith('monthly') ? 'monthly' : 'yearly')
        setCheckoutStateId(params.get('state_id') ?? undefined)
        setCheckoutPlanKey(requestedPlan)
      }
    }

    if (params.get('canceled') === 'true') {
      setShowCanceled(true)
      const timer = setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname)
        setShowCanceled(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [userEmail])

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
              className={[
                'plans-card',
                plan.isDiscounted && !isCurrent ? 'plans-card-discounted' : '',
                plan.isPopular && !isCurrent ? 'plans-card-popular' : '',
                plan.isUnavailable ? 'plans-card-unavailable' : '',
                isCurrent ? 'plans-card-current' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-disabled={plan.isUnavailable || undefined}
            >
              {isCurrent ? (
                <span className="plans-badge plans-badge-current">Your plan</span>
              ) : plan.badge ? (
                <span className="plans-badge plans-badge-discounted">{plan.badge}</span>
              ) : null}
              <div className="plans-card-header">
                <h2 className="plans-card-title">{renderPlanTitle(plan.label)}</h2>
                <p className="plans-card-price">
                  {plan.originalPrice && (
                    <span className="plans-card-price-original">{plan.originalPrice}</span>
                  )}
                  {plan.price}
                  {plan.priceUnit && (
                    <span className="plans-card-price-unit">{plan.priceUnit}</span>
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

              {mustChooseAfterTrial && plan.id === 'free' ? (
                <div className="plans-card-cta">
                  <button
                    type="button"
                    onClick={chooseFree}
                    disabled={savingFreeChoice}
                    className="plans-btn plans-btn-outline"
                  >
                    {savingFreeChoice ? 'Saving…' : 'Continue with Free'}
                  </button>
                </div>
              ) : isCurrent ? (
                <div className="plans-card-cta">
                  <span className="plans-btn plans-btn-current" aria-disabled="true">
                    Current plan
                  </span>
                </div>
              ) : plan.isUnavailable ? (
                <div className="plans-card-cta">
                  <button
                    type="button"
                    disabled
                    className="plans-btn plans-btn-disabled"
                    aria-disabled="true"
                  >
                    {plan.cta}
                  </button>
                </div>
              ) : plan.billingPlanKey ? (
                <CheckoutButton
                  planKey={plan.billingPlanKey}
                  className={`plans-btn ${plan.isDiscounted ? 'plans-btn-primary' : 'plans-btn-outline'}`}
                  onCheckout={openCheckout}
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

      {checkoutPlanKey && userEmail && (
        <WhopCheckoutModal
          email={userEmail}
          planKey={checkoutPlanKey}
          stateId={checkoutStateId}
          onClose={closeCheckout}
        />
      )}
    </>
  )
}
