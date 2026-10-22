'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import posthog from 'posthog-js'
import { PricingPlans } from '@/components/checkout/PricingPlans'
import { logout } from '@/app/actions/auth'
import { paywallFeatureFromPath } from '@/lib/paywall-analytics'

interface FreeUserGateProps {
  isFreeUser: boolean
}

export function FreeUserGate({ isFreeUser }: FreeUserGateProps) {
  const pathname = usePathname()

  const isExcluded =
    !isFreeUser ||
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    // Drills (the home page) are free for everyone.
    pathname === '/' ||
    pathname.startsWith('/drills')

  useEffect(() => {
    if (isExcluded) {
      document.body.removeAttribute('data-gated')
      document.body.style.overflow = ''
    } else {
      document.body.setAttribute('data-gated', 'true')
      document.body.style.overflow = 'hidden'
      const properties = {
        source: 'free_user_gate',
        pathname,
        feature: paywallFeatureFromPath(pathname),
        plans_shown: ['core', 'premium'],
        default_billing_cycle: 'yearly',
      }
      // `paywall_shown` is the canonical funnel step; `free_user_gate_shown`
      // stays for existing insights (same dual-capture pattern as checkout).
      posthog.capture('paywall_shown', properties)
      posthog.capture('free_user_gate_shown', properties)
    }
    return () => {
      document.body.removeAttribute('data-gated')
      document.body.style.overflow = ''
    }
  }, [isExcluded, pathname])

  if (isExcluded) return null

  return (
    <div className="gate-overlay" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div className="gate-modal gate-modal-plans">
        <h2 id="gate-title" className="gate-title">
          Upgrade now to keep<br /><em>practicing your writing</em>
        </h2>
        <div className="gate-plans">
          <PricingPlans currentPlanId={null} source="free_user_gate" />
        </div>
        <form action={logout} className="gate-logout">
          <button
            type="submit"
            className="gate-logout-btn"
            onClick={() => posthog.capture('gate_logout_clicked', { pathname })}
          >
            Wrong account? Sign out
          </button>
        </form>
      </div>
    </div>
  )
}

