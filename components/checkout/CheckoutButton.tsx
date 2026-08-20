'use client'

import posthog from 'posthog-js'
import { BILLING_PLANS, type BillingPlanKey } from '@/lib/billing-plans'
import { trackWhopEvent } from '@/lib/whop-pixel'

interface CheckoutButtonProps {
  planKey: BillingPlanKey
  children: React.ReactNode
  className?: string
  variant?: 'primary' | 'outline'
}

export function CheckoutButton({
  planKey,
  children,
  className = 'plans-btn plans-btn-primary',
  variant = 'primary',
}: CheckoutButtonProps) {
  const handleCheckout = () => {
    const plan = BILLING_PLANS[planKey]
    trackWhopEvent('add_to_cart')
    posthog.capture('checkout_initiated', {
      provider: 'whop',
      plan_key: plan.key,
      product: plan.appPlanId,
      billing_cycle: plan.billingCycle,
    })
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
