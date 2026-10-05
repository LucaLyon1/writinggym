'use client'

import type { ReactNode } from 'react'
import posthog from 'posthog-js'
import { logout } from '@/app/actions/auth'

interface LogoutFormProps {
  className?: string
  children: ReactNode
}

/**
 * Sign-out form. `logout` runs server-side, so the browser Supabase client
 * never emits SIGNED_OUT and PostHogIdentify can't reset. Reset PostHog here,
 * before the action runs, so the next visitor on this browser doesn't inherit
 * the previous user's distinct_id.
 */
export function LogoutForm({ className, children }: LogoutFormProps) {
  return (
    <form action={logout} className={className} onSubmit={() => posthog.reset()}>
      {children}
    </form>
  )
}
