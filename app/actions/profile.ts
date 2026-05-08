'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { validateUsername } from '@/lib/username'
import { STREAK_BADGES } from '@/lib/streak-badges'

export type ProfileUsernameState = {
  error?: string
  success?: string
}

export async function updateUsername(
  _prev: ProfileUsernameState | undefined,
  formData: FormData
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be signed in to update your username.' }
  }

  const usernameResult = validateUsername(formData.get('username'))
  if (!usernameResult.ok) {
    return { error: usernameResult.error }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ username: usernameResult.username })
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') {
      return { error: 'This username is already taken.' }
    }
    return { error: error.message }
  }

  revalidatePath('/profile')
  return { success: 'Username saved.' }
}

export async function updateSelectedBadge(badgeLabel: string | null) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  if (badgeLabel !== null && !STREAK_BADGES.some((b) => b.label === badgeLabel)) {
    return { error: 'Invalid badge.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ selected_badge: badgeLabel })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  return { success: true }
}
