import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/database.types'
import { CompletionHeatmap } from '@/components/CompletionHeatmap'
import { StreakBadges } from '@/components/StreakBadges'
import { getCurrentBadge, STREAK_BADGES } from '@/lib/streak-badges'
import { getUserEntitlements } from '@/lib/plan'
import { ManageSubscriptionButton } from '@/components/checkout/ManageSubscriptionButton'
import { ProfileSubmissionsList } from '@/components/ProfileSubmissionsList'
import { ProfileUsernameForm } from '@/components/profile/ProfileUsernameForm'
import { ProfileSetPassword } from '@/components/profile/ProfileSetPassword'
import { logout } from '@/app/actions/auth'
import { AppFooter } from '@/components/AppFooter'

type PassageCompletion = Tables<'passage_completions'>

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/signup?next=/profile')
  }

  const [entitlements, profileResult, statsResult, firstPageResult] = await Promise.all([
    getUserEntitlements(user.id),
    supabase
      .from('profiles')
      .select('current_streak, longest_streak, total_passages_done, total_sessions, username, selected_badge, is_founding_member')
      .eq('id', user.id)
      .single(),
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

  const featuredBadge = profile?.selected_badge
    ? STREAK_BADGES.find((b) => b.label === profile.selected_badge) ?? null
    : getCurrentBadge(currentStreak)

  return (
    <div className="profile-root">
      <div className="profile-inner">
        <Link href="/" className="profile-back-link">
          ← Back to main screen
        </Link>

        {/* ── Hero ── */}
        <header className="profile-hero">
          <div className="profile-hero-name">
            <ProfileUsernameForm initialUsername={profile?.username ?? ''} />
          </div>
          <div className="profile-hero-badges">
            {profile?.is_founding_member && (
              <span className="profile-founding-badge" title="You supported rewrite during its pre-release — thank you!">
                🚀 Founding Member
              </span>
            )}
            {featuredBadge && (
              <span className="profile-hero-streak-badge" title={`${featuredBadge.label} — ${currentStreak} day streak`}>
                <span aria-hidden>{featuredBadge.emoji}</span> {featuredBadge.label}
              </span>
            )}
          </div>
          <div className="profile-hero-plan">
            <span className={`profile-plan-badge ${entitlements.plan_id !== 'free' ? 'profile-plan-badge-paid' : 'profile-plan-badge-free'}`}>
              {entitlements.plan_label}
            </span>
            {entitlements.plan_id === 'free' ? (
              <Link href="/pricing" className="profile-hero-upgrade">
                Upgrade →
              </Link>
            ) : (
              <ManageSubscriptionButton className="profile-hero-manage">
                Manage subscription →
              </ManageSubscriptionButton>
            )}
            <ProfileSetPassword />
            <form action={logout}>
              <button type="submit" className="profile-hero-signout">
                Sign out →
              </button>
            </form>
          </div>
        </header>

        {/* ── Activity ── */}
        <CompletionHeatmap completions={statsCompletions ?? []} />

        {/* ── Stats ── */}
        <section className="profile-stats-section" aria-label="Your stats">
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
              <span className="profile-quota-value">{totalWordsWritten.toLocaleString()}</span>
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
          <StreakBadges currentStreak={currentStreak} selectedBadge={profile?.selected_badge ?? null} />
        </section>

        {/* ── Submissions ── */}
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
      <AppFooter />
    </div>
  )
}
