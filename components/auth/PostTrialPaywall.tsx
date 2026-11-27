'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CheckoutButton } from '@/components/checkout/CheckoutButton'
import posthog from 'posthog-js'
import { BILLING_PLANS, type BillingPlanKey } from '@/lib/billing-plans'
import {
  BLACK_FRIDAY_DISCOUNT_USD,
  blackFridayYearlyPriceUsd,
  formatUsd,
  yearlyToMonthlyUsd,
} from '@/lib/black-friday'
import { paywallFeatureFromPath } from '@/lib/paywall-analytics'

interface Props {
  show: boolean
  /** Render the Black Friday yearly price while the offer window is open. */
  blackFriday?: boolean
}

type BillingCycle = 'yearly' | 'monthly'

interface PlanDisplay {
  price: string
  originalPrice?: string
  priceNote: string
  billingPlanKey: BillingPlanKey
}

const CORE_PLANS: Record<BillingCycle, PlanDisplay> = {
  yearly: {
    price: '$8.25',
    priceNote: 'Billed $99 annually — save 17%',
    billingPlanKey: 'core-yearly',
  },
  monthly: {
    price: '$9.99',
    priceNote: 'Billed monthly',
    billingPlanKey: 'core-monthly',
  },
}

function blackFridayCoreYearly(): PlanDisplay {
  const listYearlyUsd = BILLING_PLANS['core-yearly'].priceUsd
  const saleYearly = blackFridayYearlyPriceUsd(listYearlyUsd)
  return {
    price: formatUsd(yearlyToMonthlyUsd(saleYearly)),
    originalPrice: formatUsd(yearlyToMonthlyUsd(listYearlyUsd)),
    priceNote: `Billed ${formatUsd(saleYearly)} for the year — ${formatUsd(BLACK_FRIDAY_DISCOUNT_USD)} off, renews at ${formatUsd(saleYearly)}`,
    billingPlanKey: 'core-yearly',
  }
}

const FEATURES = [
  'Unlimited AI feedback on every rewrite',
  'Follow-up chat after every analysis',
  'Full extract library',
  'Cancel anytime',
]

export function PostTrialPaywall({ show, blackFriday = false }: Props) {
  const [billing, setBilling] = useState<BillingCycle>('yearly')
  const pathname = usePathname()
  const visible = show && pathname !== '/pricing'

  useEffect(() => {
    if (!visible) return
    posthog.capture('paywall_shown', {
      source: 'post_trial_paywall',
      pathname,
      feature: paywallFeatureFromPath(pathname),
      plans_shown: ['core'],
      default_billing_cycle: 'yearly',
    })
  }, [visible, pathname])

  // Hide on /pricing so the user can pick the Free option there.
  if (!visible) return null

  const plan = blackFriday && billing === 'yearly' ? blackFridayCoreYearly() : CORE_PLANS[billing]

  return (
    <div className="post-trial-overlay" role="dialog" aria-modal="true">
      <div className="post-trial-modal">
        <h2 className="post-trial-title">Your free trial has ended</h2>
        <p className="post-trial-subtitle">
          Pick a plan to keep practicing.
        </p>

        <div className="post-trial-billing-toggle">
          <button
            type="button"
            className={`post-trial-billing-btn${billing === 'yearly' ? ' post-trial-billing-btn-active' : ''}`}
            onClick={() => {
              setBilling('yearly')
              posthog.capture('billing_cycle_toggled', { cycle: 'yearly', source: 'post_trial_paywall' })
            }}
            aria-pressed={billing === 'yearly'}
          >
            Yearly
            <span className="post-trial-billing-badge">{blackFriday ? 'Save 34%' : 'Save 17%'}</span>
          </button>
          <button
            type="button"
            className={`post-trial-billing-btn${billing === 'monthly' ? ' post-trial-billing-btn-active' : ''}`}
            onClick={() => {
              setBilling('monthly')
              posthog.capture('billing_cycle_toggled', { cycle: 'monthly', source: 'post_trial_paywall' })
            }}
            aria-pressed={billing === 'monthly'}
          >
            Monthly
          </button>
        </div>

        <article className="post-trial-card">
          <header className="post-trial-card-header">
            <h3 className="post-trial-card-title">ProseLab Core</h3>
            <p className="post-trial-card-price">
              {plan.originalPrice && (
                <span className="post-trial-card-price-original">{plan.originalPrice}</span>
              )}
              {plan.price}
              <span className="post-trial-card-price-unit"> / month</span>
            </p>
            <p className="post-trial-card-price-note">{plan.priceNote}</p>
          </header>

          <ul className="post-trial-features">
            {FEATURES.map((f) => (
              <li key={f} className="post-trial-feature">
                <span className="post-trial-feature-check" aria-hidden>✓</span>
                {f}
              </li>
            ))}
          </ul>

          <CheckoutButton
            planKey={plan.billingPlanKey}
            className="post-trial-cta"
            source="post_trial_paywall"
          >
            Get ProseLab Core
          </CheckoutButton>
        </article>

        <Link href="/pricing" className="post-trial-more-link">
          See all plans →
        </Link>
      </div>
    </div>
  )
}
