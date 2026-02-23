import Link from 'next/link'

export default function EmailVerifiedPage() {
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
          href="/login"
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
