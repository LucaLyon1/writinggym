import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="auth-page">
      <LoginForm />
      <Link href="/" className="auth-back">
        ← Back to Proselab
      </Link>
    </div>
  )
}
