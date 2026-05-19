import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPostHogClient } from '@/lib/posthog-server'

// Records that a free user picked "stay free" after their 7-day trial.
// Once recorded, the post-trial paywall modal no longer shows for them.
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({ post_trial_choice_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const posthog = getPostHogClient()
  posthog.capture({ distinctId: user.id, event: 'post_trial_chose_free' })
  await posthog.shutdown()

  return NextResponse.json({ ok: true })
}
