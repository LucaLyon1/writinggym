import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/database.types'
import { CompletionHeatmap } from '@/components/CompletionHeatmap'
import { StreakBadges } from '@/components/StreakBadges'
import { getCurrentBadge } from '@/lib/streak-badges'
import { getUserEntitlements } from '@/lib/plan'
import { ManageSubscriptionButton } from '@/components/checkout/ManageSubscriptionButton'
import { ProfileSubmissionsList } from '@/components/ProfileSubmissionsList'

type PassageCompletion = Tables<'passage_completions'>

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const [entitlements, profileResult, statsResult, firstPageResult] = await Promise.all([
    getUserEntitlements(user.id),
    supabase.from('profiles').select('current_streak, longest_streak, total_passages_done, total_sessions').eq('id', user.id).single(),
    supabase
      .from('passage_completions')
      .select('completed_at, word_count')
      .eq('user_id', user.id),
    supabase
      .from('passage_completions')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .range(0, 4),
  ])
  const { data: profile } = profileResult
  const { data: statsCompletions, error: statsError } = statsResult
  const { data: firstPageCompletions, error: listError } = firstPageResult

  const error = statsError ?? listError
  const totalWordsWritten = (statsCompletions ?? []).reduce(
    (sum, c) => sum + (c.word_count ?? 0),
    0
  )
  const currentStreak = profile?.current_streak ?? 0
  const longestStreak = profile?.longest_streak ?? 0
  const totalCount = Math.max(
    statsCompletions?.length ?? 0,
    profile?.total_passages_done ?? 0
  )

  if (error) {
    return (
      <div className="profile-root">
        <div className="profile-inner">
          <Link href="/" className="profile-back-link">
            ← Back to main screen
          </Link>
          <p className="profile-error">Failed to load your submissions.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-root">
      <div className="profile-inner">
        <Link href="/" className="profile-back-link">
          ← Back to main screen
        </Link>
        <header className="profile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h1 className="profile-title" style={{ marginBottom: 0 }}>Your submissions</h1>
            <span
              className={`profile-plan-badge ${
                entitlements.plan_id !== 'free'
                  ? 'profile-plan-badge-paid'
                  : 'profile-plan-badge-free'
              }`}
            >
              {entitlements.plan_label} plan
            </span>
          </div>
          <p className="profile-subtitle">
            {totalCount} passage
            {totalCount !== 1 ? 's' : ''} completed
          </p>
        </header>

        <section className="profile-quotas" aria-label="Usage quotas and stats">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 className="profile-quotas-title" style={{ marginBottom: 0 }}>Your plan</h2>
            {entitlements.plan_id === 'free' ? (
              <Link href="/pricing" className="profile-manage-subscription">
                Upgrade →
              </Link>
            ) : (
              <ManageSubscriptionButton className="profile-manage-subscription">
                Manage subscription →
              </ManageSubscriptionButton>
            )}
          </div>
          <div className="profile-quotas-grid">
            <div className="profile-quota-card">
              <span className="profile-quota-label">Plan</span>
              <span className="profile-quota-value">{entitlements.plan_label}</span>
            </div>
            {entitlements.weekly_analysis_limit != null ? (
              <div className="profile-quota-card">
                <span className="profile-quota-label">Analyses this week</span>
                <span className="profile-quota-value">
                  {Math.max(0, entitlements.weekly_analysis_limit - entitlements.analyses_used_this_week)} remaining
                </span>
                <div className="profile-quota-bar">
                  <div
                    className="profile-quota-bar-fill"
                    style={{
                      width: `${Math.min(100, entitlements.weekly_analysis_limit > 0
                        ? (entitlements.analyses_used_this_week / entitlements.weekly_analysis_limit) * 100
                        : 0
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="profile-quota-card">
                <span className="profile-quota-label">Analyses</span>
                <span className="profile-quota-value">Unlimited</span>
              </div>
            )}
            <div className="profile-quota-card">
              <span className="profile-quota-label">Extract library</span>
              <span className="profile-quota-value">
                {entitlements.extract_access === 'full' ? 'Full access' : entitlements.extract_access === 'core' ? 'Core' : 'Restricted'}
              </span>
            </div>
            {entitlements.has_playground && (
              <div className="profile-quota-card">
                <span className="profile-quota-label">Playground</span>
                <span className="profile-quota-value">Active</span>
              </div>
            )}
          </div>
          <div className="profile-quotas-stats">
            <h2 className="profile-quotas-title">Your stats</h2>
            <div className="profile-quotas-grid">
              <div className="profile-quota-card profile-quota-card-streak">
                <span className="profile-quota-label">Current streak</span>
                <span className="profile-quota-value profile-quota-value-streak">
                  {getCurrentBadge(currentStreak)?.emoji && (
                    <span className="profile-quota-badge" aria-hidden>
                      {getCurrentBadge(currentStreak)!.emoji}
                    </span>
                  )}
                  {currentStreak} day{currentStreak !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="profile-quota-card">
                <span className="profile-quota-label">Longest streak</span>
                <span className="profile-quota-value">
                  {longestStreak} day{longestStreak !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="profile-quota-card">
                <span className="profile-quota-label">Words written</span>
                <span className="profile-quota-value">
                  {totalWordsWritten.toLocaleString()}
                </span>
              </div>
              <div className="profile-quota-card">
                <span className="profile-quota-label">Total sessions</span>
                <span className="profile-quota-value">{profile?.total_sessions ?? 0}</span>
              </div>
              <div className="profile-quota-card">
                <span className="profile-quota-label">Passages completed</span>
                <span className="profile-quota-value">{totalCount}</span>
              </div>
            </div>
            <StreakBadges currentStreak={currentStreak} />
          </div>
        </section>

        <CompletionHeatmap completions={statsCompletions ?? []} />

        {!totalCount ? (
          <div className="profile-empty">
            <p>You haven&apos;t completed any passages yet.</p>
            <Link href="/" className="profile-empty-link">
              Browse passages and start writing
            </Link>
          </div>
        ) : (
          <ProfileSubmissionsList
            initialCompletions={(firstPageCompletions ?? []) as PassageCompletion[]}
          />
        )}
      </div>
    </div>
  )
}
