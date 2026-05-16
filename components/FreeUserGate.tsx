'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { PricingPlans } from '@/components/checkout/PricingPlans'
import { logout } from '@/app/actions/auth'

interface FreeUserGateProps {
  isFreeUser: boolean
}

export function FreeUserGate({ isFreeUser }: FreeUserGateProps) {
  const pathname = usePathname()

  const isExcluded =
    !isFreeUser ||
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup')

  useEffect(() => {
    if (isExcluded) {
      document.body.removeAttribute('data-gated')
      document.body.style.overflow = ''
    } else {
      document.body.setAttribute('data-gated', 'true')
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.removeAttribute('data-gated')
      document.body.style.overflow = ''
    }
  }, [isExcluded])

  if (isExcluded) return null

  return (
    <div className="gate-overlay" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div className="gate-modal gate-modal-plans">
        <h2 id="gate-title" className="gate-title">
          Upgrade now to start<br /><em>practicing your writing</em>
        </h2>
        <div className="gate-plans">
          <PricingPlans currentPlanId={null} />
        </div>
        <form action={logout} className="gate-logout">
          <button type="submit" className="gate-logout-btn">
            Wrong account? Sign out
          </button>
        </form>
      </div>
    </div>
  )
}
