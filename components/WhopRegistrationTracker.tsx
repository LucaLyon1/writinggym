'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  trackWhopEvent,
  whopLeadEventId,
  whopRegistrationEventId,
} from '@/lib/whop-pixel'

const REGISTRATION_PARAM = 'whop_registration'
const LEAD_PARAM = 'whop_lead'

export function WhopRegistrationTracker() {
  useEffect(() => {
    const initialUrl = new URL(window.location.href)
    const shouldRegister = initialUrl.searchParams.get(REGISTRATION_PARAM) === '1'
    const shouldLead = initialUrl.searchParams.get(LEAD_PARAM) === '1'
    if (!shouldRegister && !shouldLead) return

    let cancelled = false

    async function run() {
      let user: { id: string; email?: string } | null = null
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getUser()
        user = data.user
      } catch {
        // Pixel is best-effort; never block auth redirect cleanup.
      }
      // Strict mode / unmount: the re-run fires instead, so we track once.
      if (cancelled) return

      const email = user?.email || undefined

      if (shouldLead && user) {
        trackWhopEvent('lead', {
          ...(email ? { email } : {}),
          event_id: email ? await whopLeadEventId(email) : `lead_${user.id}`,
          external_id: user.id,
        })
      }

      if (shouldRegister) {
        // event_id makes a refresh (or the params lingering after
        // Onboarding's router.replace) collapse into one registration.
        trackWhopEvent(
          'complete_registration',
          user
            ? {
                ...(email ? { email } : {}),
                event_id: whopRegistrationEventId(user.id),
                external_id: user.id,
              }
            : undefined,
        )
      }

      // Re-read the current URL: other components (Onboarding) may have
      // already rewritten it since mount.
      const url = new URL(window.location.href)
      url.searchParams.delete(REGISTRATION_PARAM)
      url.searchParams.delete(LEAD_PARAM)
      window.history.replaceState(
        window.history.state,
        '',
        `${url.pathname}${url.search}${url.hash}`,
      )
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  return null
}
