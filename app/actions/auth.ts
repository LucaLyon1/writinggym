'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { addContactToAudience } from '@/lib/resend'
import { validateUsername } from '@/lib/username'
import { getPostHogClient } from '@/lib/posthog-server'

export type AuthState = {
  error?: string
  /** Restore when re-enabling Supabase "Confirm email" + returning success from signup. */
  success?: string
}

export async function signup(_prevState: AuthState | undefined, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const next = (formData.get('next') as string) || '/'

  const usernameResult = validateUsername(formData.get('username'))
  if (!usernameResult.ok) {
    return { error: usernameResult.error }
  }

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  /*
   * Launch: no confirmation email — auto sign-in (requires Confirm email OFF in Supabase).
   * Previous flow (re-enable when you turn email confirmation back on):
   *
   *   const siteUrl =
   *     process.env.NEXT_PUBLIC_SITE_URL ??
   *     (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
   *   const emailRedirectTo =
   *     next && next.startsWith('/')
   *       ? `${siteUrl}/email-verified?next=${encodeURIComponent(next)}`
   *       : `${siteUrl}/email-verified`
   *
   *   const { error } = await supabase.auth.signUp({
   *     email,
   *     password,
   *     options: { emailRedirectTo },
   *   })
   *   // … then return instead of redirect:
   *   return {
   *     success:
   *       'Check your email for the confirmation link. You can also sign in if your account is already confirmed.',
   *   }
   */

  // Requires "Confirm email" disabled in Supabase Auth so signUp returns a session.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  const userId = data.user?.id
  if (!userId) {
    return { error: 'Account was created but we could not set up your profile. Please contact support.' }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ username: usernameResult.username })
    .eq('id', userId)

  if (profileError) {
    if (profileError.code === '23505') {
      return { error: 'This username is already taken.' }
    }
    return {
      error:
        profileError.message ||
        'Account was created but we could not save your username. Try updating it from your profile.',
    }
  }

  addContactToAudience(email)

  const posthogSignup = getPostHogClient()
  posthogSignup.identify({ distinctId: userId, properties: { email, username: usernameResult.username } })
  posthogSignup.capture({ distinctId: userId, event: 'user_signed_up', properties: { email, username: usernameResult.username } })
  await posthogSignup.shutdown()

  revalidatePath('/', 'layout')

  if (data.session) {
    redirect(next)
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

  if (!signInError) {
    redirect(next)
  }

  return {
    error:
      'Account was created but we could not sign you in automatically. Try signing in from the login page.',
  }
}

export async function login(_prevState: AuthState | undefined, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const next = (formData.get('next') as string) || '/'

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const { data: loginData, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  const loginUserId = loginData.user?.id
  if (loginUserId) {
    const posthogLogin = getPostHogClient()
    posthogLogin.identify({ distinctId: loginUserId, properties: { email } })
    posthogLogin.capture({ distinctId: loginUserId, event: 'user_logged_in', properties: { email } })
    await posthogLogin.shutdown()
  }

  revalidatePath('/', 'layout')
  redirect(next)
}

export async function signInWithGoogle(next?: string) {
  const supabase = await createClient()
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const redirectTo =
    next && next.startsWith('/')
      ? `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`
      : `${siteUrl}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })

  if (error) {
    return { error: error.message }
  }

  if (data?.url) {
    redirect(data.url)
  }

  return { error: 'Failed to get Google sign-in URL' }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
