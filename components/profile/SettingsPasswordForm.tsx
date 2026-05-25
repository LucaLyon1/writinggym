'use client'

import { useActionState, useRef } from 'react'
import { setPassword } from '@/app/actions/auth'

export function SettingsPasswordForm() {
  const [state, formAction, isPending] = useActionState(setPassword, undefined)
  const formRef = useRef<HTMLFormElement>(null)

  if (state?.success) {
    return (
      <p className="settings-field-success">{state.success}</p>
    )
  }

  return (
    <form ref={formRef} action={formAction} className="settings-password-form">
      <div className="settings-password-row">
        <input
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="New password (min 6 characters)"
          className="settings-input"
          disabled={isPending}
          autoComplete="new-password"
        />
        <button type="submit" className="settings-save-btn" disabled={isPending}>
          {isPending ? 'Saving…' : 'Set password'}
        </button>
      </div>
      {state?.error && (
        <p className="settings-field-error" role="alert">{state.error}</p>
      )}
    </form>
  )
}
