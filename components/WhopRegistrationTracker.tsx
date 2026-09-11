'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { trackWhopEvent } from '@/lib/whop-pixel'

const REGISTRATION_PARAM = 'whop_registration'
const LEAD_PARAM = 'whop_lead'

export function WhopRegistrationTracker() {
  useEffect(() => {
    const url = new URL(window.location.href)
    const shouldRegister = url.searchParams.get(REGISTRATION_PARAM) === '1'
    const shouldLead = url.searchParams.get(LEAD_PARAM) === '1'
    if (!shouldRegister && !shouldLead) return

    let cancelled = false

    async function run() {
      if (shouldLead) {
        try {
          const supabase = createClient()
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (!cancelled && user) {
            trackWhopEvent('lead', {
              ...(user.email ? { email: user.email } : {}),
              event_id: `lead_${user.id}`,
              ...(user.id ? { external_id: user.id } : {}),
            })
          }
        } catch {
          // Pixel is best-effort; never block auth redirect cleanup.
        }
      }

      if (shouldRegister && !cancelled) {
        trackWhopEvent('complete_registration')
      }

      if (cancelled) return
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
