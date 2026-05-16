import { createClient } from '@/lib/supabase/server'
import { addContactToAudience } from '@/lib/resend'
import { generateUsernameFromEmail } from '@/lib/username'
import { getPostHogClient } from '@/lib/posthog-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const rawNext = requestUrl.searchParams.get('next') ?? '/'
  const next = rawNext.startsWith('/') ? rawNext : '/'

  if (!code) {
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }
  const user = data.user
  const email = user.email ?? ''

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .maybeSingle()

  const isNewUser = !profile?.username

  if (isNewUser && email) {
    const username = generateUsernameFromEmail(email)
    await supabase.from('profiles').update({ username }).eq('id', user.id)
    addContactToAudience(email)

    const posthog = getPostHogClient()
    posthog.identify({ distinctId: user.id, properties: { email, username } })
    posthog.capture({
      distinctId: user.id,
      event: 'user_signed_up',
      properties: { email, username, method: 'magic_link_or_oauth' },
    })
    await posthog.shutdown()
  } else if (email) {
    const posthog = getPostHogClient()
    posthog.identify({ distinctId: user.id, properties: { email } })
    posthog.capture({
      distinctId: user.id,
      event: 'user_logged_in',
      properties: { email, method: 'magic_link_or_oauth' },
    })
    await posthog.shutdown()
  }

  const redirectUrl = new URL(next, requestUrl.origin)
  if (isNewUser) {
    redirectUrl.searchParams.set('welcome', '1')
  }
  return NextResponse.redirect(redirectUrl)
}
