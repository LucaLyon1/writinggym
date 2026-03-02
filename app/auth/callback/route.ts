import { createClient } from '@/lib/supabase/server'
import { addContactToAudience } from '@/lib/resend'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    if (data.user?.email) {
      addContactToAudience(data.user.email)
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
