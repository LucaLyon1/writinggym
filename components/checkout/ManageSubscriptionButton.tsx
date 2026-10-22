'use client'

import { useState } from 'react'

interface ManageSubscriptionButtonProps {
  children: React.ReactNode
  className?: string
}

const FALLBACK_ERROR = 'We couldn’t open billing just now. Please try again, or email contact@proselab.io.'

export function ManageSubscriptionButton({
  children,
  className = 'profile-card-link',
}: ManageSubscriptionButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/create-portal-session', { method: 'POST' })
      // A crashed route can return HTML, so don't let JSON parsing hide the failure.
      const data = (await res.json().catch(() => ({}))) as {
        url?: string
        message?: string
      }

      if (!res.ok || !data.url) {
        throw new Error(data.message || FALLBACK_ERROR)
      }

      // Same tab: both Whop and Stripe portals link back to the app.
      window.location.assign(data.url)
    } catch (err) {
      console.error('Portal error:', err)
      setError(err instanceof Error && err.message ? err.message : FALLBACK_ERROR)
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={className}
        style={{ cursor: loading ? 'wait' : 'pointer' }}
      >
        {loading ? 'Loading…' : children}
      </button>
      {error && (
        <p className="settings-avatar-hint" role="alert">
          {error}
        </p>
      )}
    </>
  )
}
