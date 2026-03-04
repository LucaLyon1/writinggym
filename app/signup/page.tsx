import Link from 'next/link'
import { SignupForm } from '@/components/auth/SignupForm'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  return (
    <div className="auth-page">
      <SignupForm next={next} />
      <Link href="/" className="auth-back">
        ← Back to Proselab
      </Link>
    </div>
  )
}
