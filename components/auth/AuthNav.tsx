import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'

export async function AuthNav() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (data.user) {
    return (
      <nav className="auth-nav">
        <Link href="/profile" className="auth-nav-link">
          Profile
        </Link>
        <form action={logout}>
          <button type="submit" className="auth-nav-btn">
            Sign out
          </button>
        </form>
      </nav>
    )
  }

  return (
    <nav className="auth-nav">
      <Link href="/login" className="auth-nav-link">
        Sign in
      </Link>
      <Link href="/signup" className="auth-nav-btn">
        Sign up
      </Link>
    </nav>
  )
}
