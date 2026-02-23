'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import Link from 'next/link'
import { login, signInWithGoogle } from '@/app/actions/auth'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, undefined)
  const [googleError, setGoogleError] = useState<string | null>(null)

  async function handleGoogleSignIn() {
    setGoogleError(null)
    const result = await signInWithGoogle()
    if (result?.error) {
      setGoogleError(result.error)
    }
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">
        <span className="auth-logo-mark">✦</span> Sign in
      </h1>
      <p className="auth-subtitle">Welcome back to Proselab</p>

      <div className="auth-form auth-form-oauth">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="auth-google-btn"
          disabled={isPending}
        >
          <GoogleIcon />
          Sign in with Google
        </button>
      </div>
      {googleError && (
        <p className="auth-error" role="alert">
          {googleError}
        </p>
      )}

      <div className="auth-divider">
        <span>or</span>
      </div>

      <form action={formAction} className="auth-form">
        <div className="auth-field">
          <label htmlFor="email" className="auth-label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="auth-input"
            disabled={isPending}
          />
        </div>
        <div className="auth-field">
          <label htmlFor="password" className="auth-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="auth-input"
            disabled={isPending}
          />
        </div>
        {state?.error && (
          <p className="auth-error" role="alert">
            {state.error}
          </p>
        )}
        <button type="submit" className="auth-submit" disabled={isPending}>
          {isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="auth-footer">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="auth-link">
          Sign up
        </Link>
      </p>
    </div>
  )
}
