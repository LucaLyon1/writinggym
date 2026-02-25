'use client'

import { useState } from 'react'

interface ManageSubscriptionButtonProps {
  children: React.ReactNode
  className?: string
}

export function ManageSubscriptionButton({
  children,
  className = 'profile-card-link',
}: ManageSubscriptionButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/create-portal-session', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to open portal')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Portal error:', err)
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={className}
      style={{ cursor: loading ? 'wait' : 'pointer' }}
    >
      {loading ? 'Loading…' : children}
    </button>
  )
}
