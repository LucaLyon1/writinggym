import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { isWithinFreeTrial } from '@/lib/trial'

export interface AuthState {
  isAuthenticated: boolean
  userId: string | null
  userEmail: string | null
  isFreeUser: boolean
  mustChooseAfterTrial: boolean
}

/** Cached per request, so the layout and the header nav share one set of Supabase round trips. */
export const getAuthState = cache(async (): Promise<AuthState> => {
  // Let Next's dynamic-rendering signal from cookies reach the framework.
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
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
})
