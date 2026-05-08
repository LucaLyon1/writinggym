'use client'

import { useActionState, useState, useEffect } from 'react'
import { updateUsername } from '@/app/actions/profile'

export function ProfileUsernameForm({ initialUsername }: { initialUsername: string }) {
  const [isEditing, setIsEditing] = useState(false)
  const [state, formAction, isPending] = useActionState(updateUsername, undefined)

  useEffect(() => {
    if (state?.success) {
      setIsEditing(false)
    }
  }, [state?.success])

  if (!isEditing) {
    return (
      <div className="profile-username-display">
        <h1 className="profile-username-heading">
          {initialUsername || <span className="profile-username-empty">Set a username</span>}
        </h1>
        <button
          type="button"
          className="profile-username-edit-btn"
          onClick={() => setIsEditing(true)}
          aria-label="Edit username"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M9.5 1.5a1.414 1.414 0 0 1 2 2L4 11H2v-2L9.5 1.5Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <form action={formAction} className="profile-username-form">
      <div className="profile-username-edit-row">
        <input
          id="profile-username"
          name="username"
          type="text"
          required
          autoComplete="username"
          defaultValue={initialUsername}
          placeholder="e.g. alex_writer"
          className="profile-username-hero-input"
          disabled={isPending}
          minLength={3}
          maxLength={32}
          autoFocus
        />
        <div className="profile-username-actions">
          <button type="submit" className="profile-username-submit" disabled={isPending}>
            {isPending ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            className="profile-username-cancel"
            onClick={() => setIsEditing(false)}
            disabled={isPending}
          >
            Cancel
          </button>
        </div>
      </div>
      {state?.error && (
        <p className="auth-error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  )
}
