'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WhopCheckoutEmbed } from '@whop/checkout/react'
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
  planLabel: string
  stateId?: string
}

export function WhopCheckoutClient({ email, planKey, planId, planLabel, stateId }: Props) {
  const router = useRouter()
  const attemptId = useRef(crypto.randomUUID())
  const [session, setSession] = useState<CheckoutSession | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function createCheckout() {
      try {
        const response = await fetch('/api/whop/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planKey, attemptId: attemptId.current }),
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
  }, [planKey])

  const finishCheckout = (receiptId?: string) => {
    const params = new URLSearchParams({ plan: planKey, status: 'success' })
    if (receiptId) params.set('receipt', receiptId)
    router.push(`/checkout/complete?${params.toString()}`)
  }

  if (error) {
    return (
      <div className={styles.message} role="alert">
        <h2>Checkout couldn&apos;t start</h2>
        <p>{error}</p>
        <button type="button" onClick={() => window.location.reload()}>
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

  const sharedProps = {
    fallback: <div className={styles.message}>Loading secure checkout…</div>,
    theme: 'light' as const,
    themeOptions: {
      accentColor: '#a2442e',
      backgroundColor: '#f8f2e8',
      borderRadius: 12,
      buttonText: `Choose ${planLabel.replace('ProseLab ', '')}`,
    },
    prefill: { email },
    disableEmail: true,
    adaptivePricing: true,
    stateId,
    returnUrl: `${window.location.origin}/checkout/complete?plan=${encodeURIComponent(planKey)}`,
    onComplete: (_completedPlanId: string, receiptId: string | undefined) => finishCheckout(receiptId),
    onPaymentError: (paymentError: { message: string }) => setError(paymentError.message),
  }

  return (
    <div className={styles.embed}>
      {session.mode === 'session' && session.sessionId ? (
        <WhopCheckoutEmbed {...sharedProps} sessionId={session.sessionId} />
      ) : (
        <WhopCheckoutEmbed {...sharedProps} planId={session.planId || planId} />
      )}
    </div>
  )
}
