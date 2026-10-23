'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'
import { createClient } from '@/lib/supabase/client'

interface PostHogIdentifyProps {
  /** Supabase user id from the server render, so identity is set before sibling effects capture. */
  userId?: string | null
  email?: string | null
}

export function PostHogIdentify({ userId, email }: PostHogIdentifyProps = {}) {
  // Runs before the paywall effects rendered after this component, so
  // `paywall_shown` lands on the signed-in user, not on whoever this browser
  // was identified as before an account switch.
  useEffect(() => {
    if (userId && posthog.get_distinct_id() !== userId) {
      posthog.identify(userId, email ? { email } : undefined)
    }
  }, [userId, email])

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        posthog.identify(user.id, { email: user.email })
      }
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        posthog.identify(session.user.id, { email: session.user.email })
      } else if (event === 'SIGNED_OUT') {
        posthog.reset()
      }
    })

    return () => {
      subscription.subscription.unsubscribe()
    }
  }, [])

  return null
}
