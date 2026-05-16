import Link from 'next/link'

export function AuthNavAnonButtons() {
  return (
    <>
      <Link href="/login" className="auth-nav-link">
        Sign in
      </Link>
      <Link href="/signup" className="auth-nav-btn">
        Sign up
      </Link>
    </>
  )
}
