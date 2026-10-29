import { cache } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { isWithinFreeTrial } from '@/lib/trial'

interface AuthState {
  isAuthenticated: boolean
  userId: string | null
  userEmail: string | null
  isFreeUser: boolean
  mustChooseAfterTrial: boolean
}

/** Cached per request, so every caller shares one `getUser` round trip. Use it when only sign-in state matters. */
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export async function getAuthState(): Promise<AuthState> {
  // Let Next's dynamic-rendering signal from cookies reach the framework.
  const supabase = await createClient()
  try {
    const user = await getUser()
    if (!user) return { isAuthenticated: false, userId: null, userEmail: null, isFreeUser: false, mustChooseAfterTrial: false }

    const withinTrial = isWithinFreeTrial(user.created_at)

    const [{ data: sub, error: subError }, { data: profile, error: profileError }] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('post_trial_choice_at')
        .eq('id', user.id)
        .maybeSingle(),
    ])

    if (subError) {
      console.error('[FreeUserGate] subscriptions query error:', subError)
      return { isAuthenticated: true, userId: user.id, userEmail: user.email ?? null, isFreeUser: !withinTrial, mustChooseAfterTrial: false }
    }

    const isFreeUser = !sub && !withinTrial
    const hasChosen = !!profile?.post_trial_choice_at
    if (profileError) {
      console.error('[PostTrialPaywall] profile query error:', profileError)
    }

    return {
      isAuthenticated: true,
      userId: user.id,
      userEmail: user.email ?? null,
      isFreeUser,
      mustChooseAfterTrial: !sub && !withinTrial && !hasChosen,
    }
  } catch (e) {
    console.error('[FreeUserGate] unexpected error:', e)
    return { isAuthenticated: false, userId: null, userEmail: null, isFreeUser: true, mustChooseAfterTrial: false }
  }
}
