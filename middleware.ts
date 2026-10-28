import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { DEV_LOGGED_OUT_COOKIE, DEV_LOGIN_PATH } from '@/lib/dev-auth'

/** Public paths anonymous users can reach directly. Everything else redirects to /signup. */
const PUBLIC_PATHS = [
  '/',
  '/exercises',
  '/drills',
  '/login',
  '/signup',
  '/pricing',
  '/terms',
  '/privacy',
  '/cookies',
  '/email-verified',
  '/auth/callback',
  '/.well-known/apple-developer-merchantid-domain-association',
  '/api/whop-webhook',
  '/api/stripe-webhook',
]

/** Provider webhooks must skip Supabase session work (timeouts + cookie side-effects). */
const WEBHOOK_PATHS = ['/api/whop-webhook', '/api/stripe-webhook']

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
}

function isWebhookPath(pathname: string): boolean {
  return WEBHOOK_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
}

export async function middleware(request: NextRequest) {
  if (isWebhookPath(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  const { response, user, configured } = await updateSession(request)

  // Dev-only: /dev/login re-enables demo auto-login after a logout.
  if (process.env.NODE_ENV === 'development' && request.nextUrl.pathname === DEV_LOGIN_PATH) {
    const next = request.nextUrl.searchParams.get('next')
    const destination = new URL(next?.startsWith('/') ? next : '/', request.url)
    const redirect = NextResponse.redirect(destination)
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    redirect.cookies.delete(DEV_LOGGED_OUT_COOKIE)
    return redirect
  }

  if (configured && !user && !isPublic(request.nextUrl.pathname)) {
    const signupUrl = new URL('/signup', request.url)
    signupUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
    const redirect = NextResponse.redirect(signupUrl)
    // Keep refreshed or cleared auth cookies when replacing the response.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon/|favicon.ico|ingest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
