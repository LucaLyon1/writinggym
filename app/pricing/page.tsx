import Link from 'next/link'
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { PricingPlans } from '@/components/checkout/PricingPlans'
import { createClient } from '@/lib/supabase/server'

interface FaqItem {
  q: string
  a: ReactNode
}

const FAQS: FaqItem[] = [
  {
    q: 'What is "pre-release pricing"?',
    a: 'ProseLab is in pre-release. Sign up now to lock in early-bird pricing — 20% below the launch rate — for as long as you stay subscribed.',
  },
  {
    q: 'Will my price go up after launch?',
    a: "No. As long as you remain subscribed without a gap, your rate stays at the early-bird price. If you cancel and resubscribe later, you'll pay the then-current launch price.",
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes — cancel in one click from your account. You keep access through the end of the current billing period.',
  },
  {
    q: 'Can I switch between monthly and yearly?',
    a: 'Yes. You can change your billing period from your account settings whenever you like.',
  },
  {
    q: 'What does ProseLab actually do?',
    a: (
      <>
        ProseLab is a craft tool for prose. You rewrite passages from a curated
        extract library, then get a side-by-side comparison and detailed AI
        feedback — strong points, weak points, and what to try next — plus a
        follow-up chat about each rewrite. Want a taste before paying? Try a
        small snippet of everything at{' '}
        <Link href="/demo" className="plans-faq-link">
          proselab.io/demo
        </Link>
        .
      </>
    ),
  },
]

async function getCurrentPlanId(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan_id, status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .maybeSingle()

    return sub?.plan_id ?? null
  } catch {
    return null
  }
}

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/pricing')

  const currentPlanId = await getCurrentPlanId()

  return (
    <div className="plans-root">
      <div className="plans-banner" role="status" aria-live="polite">
        <span className="plans-banner-label">Pre-release pricing</span>
        <span className="plans-banner-sep" aria-hidden>
          ·
        </span>
        <span className="plans-banner-text">
          code <code className="plans-banner-code">PRERELEASE26</code> already
          applied at checkout
        </span>
      </div>

      <div className="plans-inner">
        <Link href="/" className="plans-back-link">
          ← Back to home
        </Link>

        <header className="plans-header">
          <h1 className="plans-title">
            Choose your
            <br />
            <em>plan</em>
          </h1>
          <p className="plans-subtitle">
            ProseLab is in pre-release. Lock in early-bird pricing — 20% off
            the launch rate, for as long as you stay subscribed.
          </p>
        </header>

        <PricingPlans currentPlanId={currentPlanId} />

        <p className="plans-note">
          Cancel anytime from your account, 7-day money-back guarantee included.
        </p>

        <section className="plans-faq" aria-label="Frequently asked questions">
          <p className="plans-faq-eyebrow">Questions, answered</p>
          <div className="plans-faq-list">
            {FAQS.map((item, i) => (
              <details key={item.q} className="plans-faq-item">
                <summary className="plans-faq-question">
                  <span className="plans-faq-num" aria-hidden>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="plans-faq-q-text">{item.q}</span>
                  <span className="plans-faq-icon" aria-hidden>
                    →
                  </span>
                </summary>
                <div className="plans-faq-answer">
                  <div className="plans-faq-answer-body">
                    {typeof item.a === 'string' ? <p>{item.a}</p> : item.a}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>

        <footer className="plans-footer">
          <p className="plans-footer-brought">
            Brought to you by{' '}
            <Link href="/" className="plans-footer-brought-link">
              ProseLab
            </Link>
          </p>
        </footer>
      </div>
    </div>
  )
}
