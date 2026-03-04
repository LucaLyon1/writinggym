import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function EmailVerifiedPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user && next && next.startsWith('/')) {
    redirect(next)
  }
  const loginHref = next && next.startsWith('/') ? `/login?next=${encodeURIComponent(next)}` : '/login'
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">
          <span className="auth-logo-mark">✓</span>
          Email verified
        </h1>
        <p className="auth-subtitle">
          Your email has been successfully verified. You can now log in and start using the app.
        </p>
        <Link
          href={loginHref}
          className="auth-submit"
          style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none' }}
        >
          Log in
        </Link>
      </div>
      <Link href="/" className="auth-back">
        ← Back to Proselab
      </Link>
    </div>
  )
}
