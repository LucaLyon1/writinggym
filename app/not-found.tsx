import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page not found · Proselab',
  description:
    'The page you were looking for is missing, moved, or never existed.',
}

export default function NotFound() {
  return (
    <main className="nf-root">
      <div className="nf-inner">
        <span className="nf-eyebrow">404</span>
        <h1 className="nf-title">This page slipped the edit.</h1>
        <p className="nf-lead">
          The page you&rsquo;re looking for is missing, moved, or never made it
          past the draft. It happens to the best writers.
        </p>
        <div className="nf-actions">
          <Link href="/" className="nf-btn nf-btn-primary">
            Back to the library
          </Link>
          <Link href="/assessment" className="nf-btn nf-btn-outline">
            Take the craft assessment
          </Link>
        </div>
        <p className="nf-quote">
          &ldquo;The first draft of anything is shit.&rdquo;
          <span className="nf-quote-author">— Ernest Hemingway</span>
        </p>
      </div>
    </main>
  )
}
