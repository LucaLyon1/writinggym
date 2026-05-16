'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'
import { AppFooter } from '@/components/AppFooter'

interface AuthPageFrameProps {
  mode: 'signup' | 'login'
  next?: string
}

export function AuthPageFrame({ mode, next }: AuthPageFrameProps) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const eventName = mode === 'signup' ? 'signup_page_viewed' : 'login_page_viewed'
    posthog.capture(eventName, {
      source: next ? 'redirect' : 'direct',
      next: next ?? null,
    })
  }, [mode, next])

  return (
    <div className="auth-page-fixed">
      <div className="auth-modal auth-page-modal">
        <header className="auth-modal-header">
          {mode === 'signup' ? (
            <>
              <h1 className="auth-modal-title">
                Start practicing<br /><em>for free</em>
              </h1>
              <p className="auth-modal-sub">
                7-day free trial • No card required
              </p>
            </>
          ) : (
            <>
              <h1 className="auth-modal-title">
                Welcome<br /><em>back</em>
              </h1>
              <p className="auth-modal-sub">
                Sign in to pick up where you left off.
              </p>
            </>
          )}
        </header>

        {mode === 'signup' ? (
          <SignupForm next={next} hideHeader />
        ) : (
          <LoginForm next={next} hideHeader />
        )}
      </div>
      <div className="auth-page-footer">
        <AppFooter />
      </div>
    </div>
  )
}
