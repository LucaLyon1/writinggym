import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/database.types'
import { CompletionHeatmap } from '@/components/CompletionHeatmap'
import { StreakBadges } from '@/components/StreakBadges'
import { ProfileSubmissionsList } from '@/components/ProfileSubmissionsList'
import { ProfileUsernameForm } from '@/components/profile/ProfileUsernameForm'
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

  const [profileResult, statsResult, firstPageResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('current_streak, longest_streak, total_passages_done, total_sessions, username')
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

  return (
    <div className="analysis-view">
    <div className="ea-root">
    <div className="ea-page-layout">
      <ProfileSidebar>
        <span className="sidebar-label">Account</span>
        <Link href="/profile" className="cat-btn active">
          <span className="cat-btn-label">Profile</span>
        </Link>
        <Link href="/profile/settings" className="cat-btn">
          <span className="cat-btn-label">Settings</span>
        </Link>
        <form action={logout}>
          <button type="submit" className="cat-btn">
            <span className="cat-btn-label">Sign out</span>
          </button>
        </form>
        <SidebarNav />
      </ProfileSidebar>
      <main className="ea-center-col">
        <div className="profile-bio-section">
          <div className="profile-bio-avatar" aria-hidden="true">
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url as string} alt="" className="profile-bio-avatar-img" referrerPolicy="no-referrer" />
            ) : (
              <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="40" cy="30" r="14" fill="currentColor" opacity="0.25" />
                <ellipse cx="40" cy="62" rx="22" ry="14" fill="currentColor" opacity="0.18" />
              </svg>
            )}
          </div>
          <div className="profile-bio-info">
            <div className="profile-bio-name">
              <ProfileUsernameForm initialUsername={profile?.username ?? ''} />
            </div>
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
        <CompletionHeatmap
          completions={statsCompletions ?? []}
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          totalWordsWritten={totalWordsWritten}
          totalPassages={totalCount}
        />
        <StreakBadges currentStreak={currentStreak} />
      </aside>
    </div>
    </div>
    </div>
  )
}
