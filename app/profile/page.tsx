import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/database.types'
import { CompletionHeatmap } from '@/components/CompletionHeatmap'
import { StreakBadges } from '@/components/StreakBadges'
import { getCurrentBadge, STREAK_BADGES } from '@/lib/streak-badges'
import { getUserEntitlements } from '@/lib/plan'
import { trialDaysLeft } from '@/lib/trial'
import { ManageSubscriptionButton } from '@/components/checkout/ManageSubscriptionButton'
import { ProfileSubmissionsList } from '@/components/ProfileSubmissionsList'
import { ProfileUsernameForm } from '@/components/profile/ProfileUsernameForm'
import { ProfileSetPassword } from '@/components/profile/ProfileSetPassword'
import { logout } from '@/app/actions/auth'
import { SidebarNav } from '@/components/AppSidebar'
import { ProfileSidebar } from '@/components/profile/ProfileSidebar'

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
      <div className="analysis-view">
        <div className="ea-root">
          <div className="ea-page-layout">
            <aside className="ea-left-sidebar">
              <SidebarNav />
            </aside>
            <main className="ea-center-col">
              <section className="ea-stage">
                <header className="ea-stage-head">
                  <h2 className="ea-stage-title">Profile</h2>
                </header>
                <div className="ea-stage-body">
                  <p className="profile-error">Failed to load your submissions.</p>
                </div>
              </section>
            </main>
            <aside className="ea-right-col" />
          </div>
        </div>
      </div>
    )
  }

  const featuredBadge = profile?.selected_badge
    ? STREAK_BADGES.find((b) => b.label === profile.selected_badge) ?? null
    : getCurrentBadge(currentStreak)

  const daysLeft =
    entitlements.plan_id === 'free' ? trialDaysLeft(user?.created_at) : null

  return (
    <div className="analysis-view">
    <div className="ea-root">
    <div className="ea-page-layout">
      <ProfileSidebar>
        <nav className="profile-sidebar-actions">
          <span className="sidebar-label">Account</span>
          <div className="profile-sidebar-plan">
            <span className={`profile-plan-badge ${entitlements.plan_id !== 'free' ? 'profile-plan-badge-paid' : 'profile-plan-badge-free'}`}>
              {entitlements.plan_label}
            </span>
            {daysLeft !== null && (
              <span className="profile-trial-pill" title="Free trial remaining">
                {daysLeft} day{daysLeft === 1 ? '' : 's'} left
              </span>
            )}
          </div>
          {entitlements.plan_id === 'free' ? (
            <Link href="/pricing" className="profile-sidebar-link">
              Upgrade plan →
            </Link>
          ) : (
            <ManageSubscriptionButton className="profile-sidebar-link">
              Manage subscription →
            </ManageSubscriptionButton>
          )}
          <ProfileSetPassword />
          <form action={logout}>
            <button type="submit" className="profile-sidebar-link">
              Sign out →
            </button>
          </form>
        </nav>
        <SidebarNav />
      </ProfileSidebar>
      <main className="ea-center-col">
        <div className="profile-bio-section">
          <div className="profile-bio-avatar" aria-hidden="true">
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="30" r="14" fill="currentColor" opacity="0.25" />
              <ellipse cx="40" cy="62" rx="22" ry="14" fill="currentColor" opacity="0.18" />
            </svg>
          </div>
          <div className="profile-bio-info">
            <div className="profile-bio-name">
              <ProfileUsernameForm initialUsername={profile?.username ?? ''} />
            </div>
            <p className="profile-bio-text">
              Writer, reader, reviser.
            </p>
          </div>
        </div>
        <section className="ea-stage">
          {!totalCount ? (
            <>
              <header className="ea-stage-head">
                <h2 className="ea-stage-title">Your writing</h2>
              </header>
              <div className="ea-stage-body profile-stage-body">
                <div className="profile-empty">
                  <p>You haven&apos;t completed any passages yet.</p>
                  <Link href="/" className="profile-empty-link">
                    Browse passages and start writing
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <ProfileSubmissionsList
              initialCompletions={(firstPageCompletions ?? []) as PassageCompletion[]}
            />
          )}
        </section>
      </main>
      <aside className="ea-right-col">
        <CompletionHeatmap completions={statsCompletions ?? []} />
        <div className="profile-right-stats">
          <div className="profile-right-stat">
            <span className="profile-right-stat-value">
              {getCurrentBadge(currentStreak)?.emoji && (
                <span aria-hidden>{getCurrentBadge(currentStreak)!.emoji}</span>
              )}
              {currentStreak} day{currentStreak !== 1 ? 's' : ''}
            </span>
            <span className="profile-right-stat-label">Current streak</span>
          </div>
          <div className="profile-right-stat">
            <span className="profile-right-stat-value">{longestStreak} day{longestStreak !== 1 ? 's' : ''}</span>
            <span className="profile-right-stat-label">Longest streak</span>
          </div>
          <div className="profile-right-stat">
            <span className="profile-right-stat-value">{totalWordsWritten.toLocaleString()}</span>
            <span className="profile-right-stat-label">Words written</span>
          </div>
          <div className="profile-right-stat">
            <span className="profile-right-stat-value">{totalCount}</span>
            <span className="profile-right-stat-label">Passages completed</span>
          </div>
        </div>
        <div className="profile-right-badges">
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
          <StreakBadges currentStreak={currentStreak} selectedBadge={profile?.selected_badge ?? null} />
        </div>
      </aside>
    </div>
    </div>
    </div>
  )
}
