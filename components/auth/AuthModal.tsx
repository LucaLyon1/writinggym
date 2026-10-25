'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { usePathname } from 'next/navigation'
import posthog from 'posthog-js'
import { SignupForm } from './SignupForm'
import { LoginForm } from './LoginForm'

export type AuthMode = 'signup' | 'login'
export type AuthModalSource = 'nav' | 'first_visit' | 'auth_link_error' | 'drills'

interface AuthModalContextValue {
  /** `null` until the server's auth check streams in. */
  isAuthenticated: boolean | null
  open: (mode?: AuthMode, source?: AuthModalSource, notice?: string) => void
  close: () => void
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null)

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext)
  if (!ctx) {
    throw new Error('useAuthModal must be used inside <AuthModalProvider>')
  }
  return ctx
}

type DismissMethod = 'close_button' | 'backdrop' | 'escape'

export function AuthModalProvider({
  children,
  isAuthenticatedPromise,
}: {
  children: React.ReactNode
  isAuthenticatedPromise: Promise<boolean>
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [mode, setMode] = useState<AuthMode | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const pathname = usePathname()
  const isOpen = mode !== null
  const sourceRef = useRef<AuthModalSource | null>(null)

  const open = useCallback(
    (next: AuthMode = 'signup', source: AuthModalSource = 'nav', message?: string) => {
      sourceRef.current = source
      setNotice(message ?? null)
      setMode(next)
      posthog.capture('auth_modal_opened', { initial_mode: next, source })
    },
    []
  )

  const dismiss = useCallback(
    (method: DismissMethod) => {
      if (mode === null) return
      posthog.capture('auth_modal_dismissed', { mode, method })
      sourceRef.current = null
      setNotice(null)
      setMode(null)
    },
    [mode]
  )

  const close = useCallback(() => dismiss('close_button'), [dismiss])

  useEffect(() => {
    isAuthenticatedPromise.then(setIsAuthenticated)
  }, [isAuthenticatedPromise])

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss('escape')
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, dismiss])

  const switchMode = (to: AuthMode) => {
    const from: AuthMode = to === 'signup' ? 'login' : 'signup'
    posthog.capture('auth_modal_mode_switched', { from, to })
    setMode(to)
  }

  return (
    <AuthModalContext.Provider value={{ isAuthenticated, open, close }}>
      {children}
      {isOpen && (
        <div
          className="auth-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          onClick={() => dismiss('backdrop')}
        >
          <div
            className="auth-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => dismiss('close_button')}
              className="auth-modal-close"
              aria-label="Close"
            >
              ×
            </button>

            <header className="auth-modal-header">
              {mode === 'signup' ? (
                <>
                  <h2 id="auth-modal-title" className="auth-modal-title">
                    Start practicing<br /><em>for free</em>
                  </h2>
                  <p className="auth-modal-sub">
                    7-day free trial • No card required
                  </p>
                </>
              ) : (
                <>
                  <h2 id="auth-modal-title" className="auth-modal-title">
                    Welcome<br /><em>back</em>
                  </h2>
                  <p className="auth-modal-sub">
                    Sign in to pick up where you left off.
                  </p>
                </>
              )}
            </header>

            {notice && (
              <p className="auth-error" role="alert">
                {notice}
              </p>
            )}

            {mode === 'signup' ? (
              <SignupForm
                next={pathname}
                hideHeader
                onSwitchMode={() => switchMode('login')}
              />
            ) : (
              <LoginForm
                next={pathname}
                hideHeader
                onSwitchMode={() => switchMode('signup')}
              />
            )}
          </div>
        </div>
      )}
    </AuthModalContext.Provider>
  )
}
