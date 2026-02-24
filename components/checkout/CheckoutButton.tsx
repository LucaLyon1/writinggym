'use client'

import { useState } from 'react'
import Link from 'next/link'

interface CheckoutButtonProps {
  lookupKey: string
  product: string
  mode: 'payment' | 'subscription'
  useManagedPayments?: boolean
  trialDays?: number
  successPath?: string
  cancelPath?: string
  children: React.ReactNode
  className?: string
  variant?: 'primary' | 'outline'
}

export function CheckoutButton({
  lookupKey,
  product,
  mode,
  useManagedPayments = true,
  trialDays,
  successPath = '/pricing/success',
  cancelPath = '/pricing',
  children,
  className = 'plans-btn plans-btn-primary',
  variant = 'primary',
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lookupKey,
          quantity: 1,
          mode,
          useManagedPayments,
          trialDays,
          successPath,
          cancelPath: cancelPath,
          product,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(message)
      setLoading(false)
    }
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
        disabled={loading}
        className={className || btnClass}
        aria-busy={loading}
      >
        {loading ? 'Redirecting...' : children}
      </button>
      {error && (
        <p
          className="plans-note"
          role="alert"
          style={{
            marginTop: '0.75rem',
            color: 'var(--plans-rust)',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
