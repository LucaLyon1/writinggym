import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  BILLING_PLANS,
  isBillingPlanKey,
  isConfiguredBillingPlan,
} from '@/lib/billing-plans'

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; state_id?: string }>
}) {
  const params = await searchParams
  if (!isBillingPlanKey(params.plan)) redirect('/pricing')

  const plan = BILLING_PLANS[params.plan]
  if (!isConfiguredBillingPlan(plan)) redirect('/pricing?unavailable=true')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const next = `/checkout?plan=${encodeURIComponent(plan.key)}`
    redirect(`/signup?next=${encodeURIComponent(next)}`)
  }

  const pricingParams = new URLSearchParams({ checkout: plan.key })
  if (params.state_id) pricingParams.set('state_id', params.state_id)
  redirect(`/pricing?${pricingParams.toString()}`)
}
