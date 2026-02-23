import Link from 'next/link'
import { SignupForm } from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <div className="auth-page">
      <SignupForm />
      <Link href="/" className="auth-back">
        ← Back to Proselab
      </Link>
    </div>
  )
}
