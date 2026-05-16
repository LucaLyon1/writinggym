import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import { AuthNavAnonButtons } from './AuthNavAnonButtons'

export async function AuthNav() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (data.user) {
    return (
      <nav className="auth-nav">
        <Link href="/explore" className="auth-nav-link">
          Explore
        </Link>
        <Link href="/playground" className="auth-nav-link">
          Playground
        </Link>
        <form action={logout}>
          <button type="submit" className="auth-nav-link auth-nav-link-btn">
            Sign out
          </button>
        </form>
        <Link href="/profile" className="auth-nav-btn">
          Profile
        </Link>
      </nav>
    )
  }

  return (
    <nav className="auth-nav">
      <Link href="/explore" className="auth-nav-link">
        Explore
      </Link>
      <Link href="/playground" className="auth-nav-link">
        Playground
      </Link>
      <AuthNavAnonButtons />
    </nav>
  )
}
