import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

/** Must include OAuth/email completion routes so the handler can set session cookies before gating. */
const PUBLIC_PATHS = ['/', '/login', '/signup', '/pricing', '/auth/callback']

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
}

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  if (!isPublic(request.nextUrl.pathname)) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      })

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        const signupUrl = new URL('/signup', request.url)
        signupUrl.searchParams.set('next', request.nextUrl.pathname)
        return NextResponse.redirect(signupUrl)
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|ingest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
