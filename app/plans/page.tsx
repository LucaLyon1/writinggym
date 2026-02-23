import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/database.types'

type Plan = Tables<'plans'>

function formatPrice(cents: number, interval: string | null): string {
  if (cents === 0) return 'Free'
  const dollars = cents / 100
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(dollars)
  if (interval) {
    const per = interval.toLowerCase().includes('year') ? '/year' : '/month'
    return `${formatted}${per}`
  }
  return formatted
}

function getFeatureLabel(
  key: keyof Pick<
    Plan,
    | 'daily_passage_limit'
    | 'can_access_all_passages'
    | 'can_access_packs'
    | 'can_export'
    | 'can_save_rewrites'
    | 'has_progress_tracking'
  >,
  plan: Plan
): string {
  switch (key) {
    case 'daily_passage_limit':
      return plan.daily_passage_limit == null
        ? 'Unlimited passages per day'
        : `${plan.daily_passage_limit} passages per day`
    case 'can_access_all_passages':
      return 'All passages unlocked'
    case 'can_access_packs':
      return 'Passage packs'
    case 'can_export':
      return 'Export your work'
    case 'can_save_rewrites':
      return 'Save submissions'
    case 'has_progress_tracking':
      return 'Progress tracking'
    default:
      return ''
  }
}

function getFeatureValue(
  key: keyof Pick<
    Plan,
    | 'daily_passage_limit'
    | 'can_access_all_passages'
    | 'can_access_packs'
    | 'can_export'
    | 'can_save_rewrites'
    | 'has_progress_tracking'
  >,
  plan: Plan
): boolean | string {
  const v = plan[key]
  if (key === 'daily_passage_limit') return true
  return v === true
}

const FEATURE_KEYS = [
  'daily_passage_limit',
  'can_access_all_passages',
  'can_access_packs',
  'can_export',
  'can_save_rewrites',
  'has_progress_tracking',
] as const

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'free',
    label: 'Free',
    price_cents: 0,
    interval: null,
    daily_passage_limit: 3,
    can_access_all_passages: false,
    can_access_packs: false,
    can_export: false,
    can_save_rewrites: false,
    has_progress_tracking: true,
    created_at: '',
  },
  {
    id: 'pro-monthly',
    label: 'Pro',
    price_cents: 999,
    interval: 'month',
    daily_passage_limit: null,
    can_access_all_passages: true,
    can_access_packs: true,
    can_export: true,
    can_save_rewrites: true,
    has_progress_tracking: true,
    created_at: '',
  },
  {
    id: 'pro-yearly',
    label: 'Pro',
    price_cents: 9990,
    interval: 'year',
    daily_passage_limit: null,
    can_access_all_passages: true,
    can_access_packs: true,
    can_export: true,
    can_save_rewrites: true,
    has_progress_tracking: true,
    created_at: '',
  },
]

export default async function PlansPage() {
  const supabase = await createClient()
  const { data: plansData } = await supabase
    .from('plans')
    .select('*')
    .order('price_cents', { ascending: true })

  const plans: Plan[] =
    plansData && plansData.length > 0 ? plansData : DEFAULT_PLANS

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
            Start free and upgrade when you need more passages, export, and
            full access to the library.
          </p>
        </header>

        <section className="plans-grid" aria-label="Available plans">
          {plans.map((plan) => {
            const isFree = plan.price_cents === 0
            const isPopular =
              plan.price_cents > 0 &&
              plan.interval?.toLowerCase().includes('month')
            return (
              <article
                key={plan.id}
                className={`plans-card ${isPopular ? 'plans-card-popular' : ''}`}
              >
                {isPopular && <span className="plans-badge">Most popular</span>}
                <div className="plans-card-header">
                  <h2 className="plans-card-title">{plan.label}</h2>
                  <p className="plans-card-price">
                    {formatPrice(plan.price_cents, plan.interval)}
                  </p>
                  {plan.interval &&
                    plan.interval.toLowerCase().includes('year') && (
                      <p className="plans-card-savings">
                        Save ~17% vs monthly
                      </p>
                    )}
                </div>

                <ul className="plans-features" aria-label="Plan features">
                  {FEATURE_KEYS.map((key) => {
                    const value = getFeatureValue(key, plan)
                    const label = getFeatureLabel(key, plan)
                    const show =
                      key === 'daily_passage_limit' || value === true
                    if (!show) return null
                    return (
                      <li key={key} className="plans-feature">
                        <span className="plans-feature-check" aria-hidden>
                          ✓
                        </span>
                        <span className="plans-feature-label">{label}</span>
                      </li>
                    )
                  })}
                </ul>

                <div className="plans-card-cta">
                  {isFree ? (
                    <Link href="/signup" className="plans-btn plans-btn-outline">
                      Get started free
                    </Link>
                  ) : (
                    <Link href="/signup" className="plans-btn plans-btn-primary">
                      Upgrade to {plan.label}
                    </Link>
                  )}
                </div>
              </article>
            )
          })}
        </section>

        <p className="plans-note">
          All plans include AI craft analysis, feedback, and text-to-speech.
          No credit card required for the free tier.
        </p>
      </div>
    </div>
  )
}
