import Link from 'next/link'
import { PricingPlans } from '@/components/checkout/PricingPlans'
import { createClient } from '@/lib/supabase/server'

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
  const currentPlanId = await getCurrentPlanId()

  return (
    <div className="plans-root">
      <div className="plans-inner">
        <Link href="/" className="plans-back-link">
          ← Back to home
        </Link>

        <header className="plans-header">
          <p className="plans-eyebrow">Pricing</p>
          <h1 className="plans-title">
            Choose your
            <br />
            <em>plan</em>
          </h1>
          <p className="plans-subtitle">
            Start free and upgrade when you need unlimited analyses, extracts,
            and premium features.
          </p>
        </header>

        <PricingPlans currentPlanId={currentPlanId} />

        <p className="plans-note">
          All plans include AI craft analysis, feedback, and text-to-speech.
          No credit card required for the free tier.
        </p>
      </div>
    </div>
  )
}
