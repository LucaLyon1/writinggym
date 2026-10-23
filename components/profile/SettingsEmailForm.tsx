'use client'

import { useActionState } from 'react'
import { updateEmail } from '@/app/actions/auth'

export function SettingsEmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, formAction, isPending] = useActionState(updateEmail, undefined)

  return (
    <form action={formAction} className="settings-password-form">
      <div className="settings-password-row">
        <input
          name="email"
          type="email"
          required
          defaultValue={currentEmail}
          placeholder="New email"
          className="settings-input"
          disabled={isPending}
          autoComplete="email"
        />
        <button type="submit" className="settings-save-btn" disabled={isPending}>
          {isPending ? 'Saving…' : 'Update email'}
        </button>
      </div>
      {state?.error && (
        <p className="settings-field-error" role="alert">{state.error}</p>
      )}
      {state?.success && (
        <p className="settings-field-success">{state.success}</p>
      )}
    </form>
  )
}
