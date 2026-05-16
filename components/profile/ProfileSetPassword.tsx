'use client'

import { useActionState, useState } from 'react'
import { setPassword } from '@/app/actions/auth'

export function ProfileSetPassword() {
  const [state, formAction, isPending] = useActionState(setPassword, undefined)
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <section className="profile-password-section">
        <button
          type="button"
          className="profile-password-toggle"
          onClick={() => setIsOpen(true)}
        >
          Set or change password
        </button>
        <p className="profile-password-hint">
          Add a password so you can sign in without an email link.
        </p>
      </section>
    )
  }

  return (
    <section className="profile-password-section">
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
    </section>
  )
}
