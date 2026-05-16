'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { setPassword } from '@/app/actions/auth'

export function ProfileSetPassword() {
  const [state, formAction, isPending] = useActionState(setPassword, undefined)
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isOpen])

  return (
    <div className="profile-hero-password" ref={panelRef}>
      <button
        type="button"
        className="profile-hero-password-trigger"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
      >
        Change password →
      </button>
      {isOpen && (
        <div className="profile-hero-password-panel" role="dialog" aria-label="Change password">
          <form action={formAction} className="profile-password-form">
            <label htmlFor="profile-password" className="auth-label">
              New password
            </label>
            <input
              id="profile-password"
              name="password"
              type="password"
              minLength={6}
              required
              autoComplete="new-password"
              placeholder="At least 6 characters"
              className="auth-input"
              disabled={isPending}
              autoFocus
            />
            {state?.error && (
              <p className="auth-error" role="alert">
                {state.error}
              </p>
            )}
            {state?.success && (
              <p className="profile-password-success" role="status">
                {state.success}
              </p>
            )}
            <div className="profile-password-actions">
              <button type="submit" className="auth-submit" disabled={isPending}>
                {isPending ? 'Saving…' : 'Save password'}
              </button>
              <button
                type="button"
                className="auth-link auth-link-btn"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
