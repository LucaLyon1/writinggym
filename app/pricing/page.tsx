import Link from 'next/link'
import type { ReactNode } from 'react'
import { PricingPlans } from '@/components/checkout/PricingPlans'
import { createClient } from '@/lib/supabase/server'
import { isWithinFreeTrial } from '@/lib/trial'
import { AppFooter } from '@/components/AppFooter'

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

async function getPricingState(): Promise<{
  currentPlanId: string | null
  mustChooseAfterTrial: boolean
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { currentPlanId: null, mustChooseAfterTrial: false }

    const [{ data: sub }, { data: profile }] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('plan_id, status')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('post_trial_choice_at')
        .eq('id', user.id)
        .maybeSingle(),
    ])

    const withinTrial = isWithinFreeTrial(user.created_at)
    const hasChosen = !!profile?.post_trial_choice_at
    const mustChooseAfterTrial = !sub && !withinTrial && !hasChosen

    return { currentPlanId: sub?.plan_id ?? null, mustChooseAfterTrial }
  } catch {
    return { currentPlanId: null, mustChooseAfterTrial: false }
  }
}

export default async function PricingPage() {
  const { currentPlanId, mustChooseAfterTrial } = await getPricingState()

  return (
    <div className="plans-root">
      <div className="plans-inner">
        <header className="plans-header">
          <h1 className="plans-title">
            Choose your
            <br />
            <em>plan</em>
          </h1>
          <p className="plans-subtitle">
            Unlimited sessions, AI analysis on every rewrite, and the full
            extract library. Cancel anytime.
          </p>
        </header>

        <PricingPlans
          currentPlanId={currentPlanId}
          mustChooseAfterTrial={mustChooseAfterTrial}
        />

        <p className="plans-note">
          Cancel anytime from your account, 7-day money-back guarantee included.
        </p>

        <section className="plans-faq" aria-label="Frequently asked questions">
          <h2 className="plans-faq-eyebrow">FAQs</h2>
          <div className="plans-faq-list">
            {FAQS.map((item) => (
              <details key={item.q} className="plans-faq-item">
                <summary className="plans-faq-question">
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

      </div>
      <AppFooter />
    </div>
  )
}
