'use client'

import posthog from 'posthog-js'
import { BILLING_PLANS, type BillingPlanKey } from '@/lib/billing-plans'
import { trackWhopEvent } from '@/lib/whop-pixel'
import type { CheckoutSource } from '@/lib/paywall-analytics'

interface CheckoutButtonProps {
  planKey: BillingPlanKey
  children: React.ReactNode
  className?: string
  variant?: 'primary' | 'outline'
  onCheckout?: (planKey: BillingPlanKey) => void
  /** Where the checkout started, e.g. a paywall or the pricing page. */
  source?: CheckoutSource
}

export function CheckoutButton({
  planKey,
  children,
  className = 'plans-btn plans-btn-primary',
  variant = 'primary',
  onCheckout,
  source = 'pricing_page',
}: CheckoutButtonProps) {
  const handleCheckout = () => {
    const plan = BILLING_PLANS[planKey]
    trackWhopEvent('add_to_cart')
    const checkoutProps = {
      provider: 'whop',
      plan_key: plan.key,
      product: plan.appPlanId,
      billing_cycle: plan.billingCycle,
      source,
    }
    posthog.capture('checkout_initiated', checkoutProps)
    posthog.capture('checkout_started', checkoutProps)
    if (onCheckout) {
      onCheckout(planKey)
      return
    }

    window.location.assign(`/checkout?plan=${encodeURIComponent(planKey)}`)
  }

  const btnClass =
    variant === 'outline'
      ? 'plans-btn plans-btn-outline'
      : 'plans-btn plans-btn-primary'

  return (
    <div className="plans-card-cta">
      <button
        type="button"
        onClick={handleCheckout}
        className={className || btnClass}
      >
        {children}
      </button>
    </div>
  )
}
