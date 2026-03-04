import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  return (
    <div className="auth-page">
      <LoginForm next={next} />
      <Link href="/" className="auth-back">
        ← Back to Proselab
      </Link>
    </div>
  )
}
