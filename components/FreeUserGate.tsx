'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

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
    } else {
      document.body.setAttribute('data-gated', 'true')
    }
    return () => document.body.removeAttribute('data-gated')
  }, [isExcluded])

  if (isExcluded) return null

  return (
    <div className="gate-overlay" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div className="gate-modal">
        <p className="gate-eyebrow">Early access</p>
        <h2 id="gate-title" className="gate-title">
          ProseLab is in<br /><em>paid access only</em>
        </h2>
        <p className="gate-body">
          We&apos;re not accepting free users during this phase. Upgrade to Pro to start training your writing voice.
        </p>
        <Link href="/pricing" className="gate-cta">
          See plans &amp; pricing
        </Link>
      </div>
    </div>
  )
}
