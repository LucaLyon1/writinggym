import { Suspense } from 'react'
import Link from 'next/link'
import { getUser } from '@/lib/auth-state'
import { AuthNavAnonButtons } from './AuthNavAnonButtons'

export function AuthNav() {
  return (
    <nav className="auth-nav">
      <Link href="/" className="auth-nav-link">
        Drills
      </Link>
      <Link href="/exercises" className="auth-nav-link">
        Exercises
      </Link>
      <Link href="/playground" className="auth-nav-link">
        Playground
      </Link>
      <Suspense fallback={null}>
        <AuthNavAccount />
      </Suspense>
    </nav>
  )
}

async function AuthNavAccount() {
  if (await getUser()) {
    return (
      <Link href="/profile" className="auth-nav-btn">
        My Profile
      </Link>
    )
  }

  return <AuthNavAnonButtons />
}
