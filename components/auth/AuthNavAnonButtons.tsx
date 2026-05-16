'use client'

import { useAuthModal } from './AuthModal'

export function AuthNavAnonButtons() {
  const { open } = useAuthModal()

  return (
    <>
      <button
        type="button"
        onClick={() => open('login', 'nav')}
        className="auth-nav-link auth-nav-link-btn"
      >
        Sign in
      </button>
      <button
        type="button"
        onClick={() => open('signup', 'nav')}
        className="auth-nav-btn"
      >
        Sign up
      </button>
    </>
  )
}
