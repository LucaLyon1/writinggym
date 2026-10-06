'use client'

import { useEffect, useRef, useState } from 'react'
import { loadWhop } from '@whop/elements'
import { Checkout, CheckoutElement, WhopElements } from '@whop/elements-react'
import type { Appearance } from '@whop/elements'
import type { BillingPlanKey } from '@/lib/billing-plans'
import styles from './checkout.module.css'

interface CheckoutSession {
  mode: 'direct' | 'session'
  planId: string
  sessionId?: string
}

interface Props {
  email: string
  planKey: BillingPlanKey
  planId: string
  /** Kept for callers; Elements no longer exposes custom button text. */
  planLabel: string
  stateId?: string
}

const RETURN26_PROMO_CODE = 'RETURN26'
// Sunday 23 August 2026, 23:59:59.999 Europe/London (BST).
const RETURN26_EXPIRES_AT = Date.parse('2026-08-23T22:59:59.999Z')

/** Best-effort match for legacy accent #a2442e / background #f8f2e8 / radius 12. */
const CHECKOUT_APPEARANCE: Appearance = {
  theme: {
    appearance: 'light',
    accentColor: 'tomato',
  },
  variables: {
    '--radius-3': '12px',
    '--color-background': '#f8f2e8',
  },
}

export function WhopCheckoutClient({ email, planKey, planId, planLabel, stateId }: Props) {
  void planLabel
  const attemptId = useRef(crypto.randomUUID())
  const [session, setSession] = useState<CheckoutSession | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let active = true

    async function createCheckout() {
      try {
        const response = await fetch('/api/whop/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planKey,
            attemptId: attemptId.current,
            ...(stateId ? { stateId } : {}),
          }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to start checkout')
        if (active) setSession(data as CheckoutSession)
      } catch (checkoutError) {
        if (active) {
          setError(checkoutError instanceof Error ? checkoutError.message : 'Unable to start checkout')
        }
      }
    }

    createCheckout()
    return () => { active = false }
  }, [planKey, retryCount, stateId])

  const retryCheckout = () => {
    attemptId.current = crypto.randomUUID()
    setError(null)
    setSession(null)
    setRetryCount((count) => count + 1)
  }

  if (error) {
    return (
      <div className={styles.message} role="alert">
        <h2>Checkout couldn&apos;t start</h2>
        <p>{error}</p>
        <button type="button" onClick={retryCheckout}>
          Try again
        </button>
      </div>
    )
  }

  if (!session) {
    return (
      <div className={styles.message} role="status">
        <span className={styles.spinner} aria-hidden />
        <p>Preparing your secure checkout…</p>
      </div>
    )
  }

  const returnUrl = `${window.location.origin}/checkout/complete?plan=${encodeURIComponent(planKey)}`
  const promoCode = Date.now() <= RETURN26_EXPIRES_AT ? RETURN26_PROMO_CODE : undefined
  const useConfiguration = session.mode === 'session' && Boolean(session.sessionId)
  const loadingFallback = (
    <div className={styles.message}>
      <span className={styles.spinner} aria-hidden />
      <p>Loading secure checkout…</p>
    </div>
  )

  return (
    <div className={styles.embed}>
      <WhopElements
        elements={loadWhop()}
        appearance={CHECKOUT_APPEARANCE}
        locale="en"
        onLoadError={(loadError) => {
          setError(loadError.message || 'Unable to load Whop checkout')
        }}
      >
        <Checkout
          {...(useConfiguration
            ? { checkoutConfiguration: session.sessionId }
            : {
                plan: session.planId || planId,
                // Metadata only when not using a checkout configuration — the
                // server-created config already carries Supabase identity metadata.
                ...(stateId
                  ? {
                      metadata: { state_id: stateId },
                      attribution: { source: stateId },
                    }
                  : {}),
              })}
          returnUrl={returnUrl}
          promoCode={promoCode}
          appearance={CHECKOUT_APPEARANCE}
          fallback={loadingFallback}
        >
          <CheckoutElement
            buyerEmail={email}
            lockBuyerEmail
            fallback={loadingFallback}
            onError={(elementError) => {
              setError(elementError.message || 'Checkout failed to load')
            }}
          />
        </Checkout>
      </WhopElements>
    </div>
  )
}
