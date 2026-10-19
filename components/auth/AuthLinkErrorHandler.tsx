'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'
import { useAuthModal } from './AuthModal'
import {
  authLinkErrorMessage,
  parseAuthLinkError,
  stripAuthLinkError,
} from '@/lib/auth-link-error'

/**
 * When Supabase bounces someone back with an email-link error (most often
 * otp_expired), explain what happened and offer a fresh sign-in link instead
 * of dropping them on the home page with no context. Also records the failure
 * in PostHog and removes the error from the URL.
 */
export function AuthLinkErrorHandler({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { open } = useAuthModal()

  useEffect(() => {
    const url = new URL(window.location.href)
    const err = parseAuthLinkError(url)
    if (!err) return

    posthog.capture('auth_link_error', {
      error: err.error,
      error_code: err.errorCode,
      error_description: err.errorDescription,
      is_authenticated: isAuthenticated,
    })

    window.history.replaceState(window.history.state, '', stripAuthLinkError(url))

    // Someone already signed in (e.g. they clicked an older link) doesn't need a prompt.
    if (!isAuthenticated) {
      open('login', 'auth_link_error', authLinkErrorMessage(err))
    }
  }, [open, isAuthenticated])

  return null
}
