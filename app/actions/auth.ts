'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AuthState = {
  error?: string
  success?: string
}

export async function sendMagicLink(
  _prevState: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient()

  const email = (formData.get('email') as string | null)?.trim()
  const next = (formData.get('next') as string) || '/'

  if (!email) {
    return { error: 'Email is required' }
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const emailRedirectTo =
    next && next.startsWith('/')
      ? `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`
      : `${siteUrl}/auth/callback`

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo, shouldCreateUser: true },
  })

  if (error) {
    return { error: error.message }
  }

  return {
    success: `We sent a sign-in link to ${email}. Click the link in your inbox to continue.`,
  }
}

export async function setPassword(
  _prevState: { error?: string; success?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be signed in to set a password.' }
  }

  const password = (formData.get('password') as string | null) ?? ''
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/profile')
  return { success: 'Password saved. You can now sign in with email + password too.' }
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
