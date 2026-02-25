import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { passages, categories } from '@/data/passages'
import type { Tables } from '@/types/database.types'
import { deleteCompletionAction } from '@/app/actions/completions'
import { CompletionHeatmap } from '@/components/CompletionHeatmap'
import { StreakBadges } from '@/components/StreakBadges'
import { computeStreaksFromCompletions } from '@/lib/streak'
import { getCurrentBadge } from '@/lib/streak-badges'
import { getUserEntitlements, type Entitlements } from '@/lib/plan'

type PassageCompletion = Tables<'passage_completions'>

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getCategoryLabel(categoryId: string) {
  return categories.find((c) => c.id === categoryId)?.label ?? categoryId
}

function getFeedbackSummary(feedback: unknown): string | null {
  if (!feedback || typeof feedback !== 'object') return null
  const f = feedback as { summary?: string[]; feedback?: string }
  if (Array.isArray(f.summary) && f.summary.length > 0) {
    return f.summary[0]
  }
  if (typeof f.feedback === 'string') {
    return f.feedback.slice(0, 150) + (f.feedback.length > 150 ? '…' : '')
  }
  return null
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const [entitlements, profileResult, completionsResult] = await Promise.all([
    getUserEntitlements(user.id),
    supabase.from('profiles').select('current_streak, longest_streak, total_passages_done, total_sessions').eq('id', user.id).single(),
    supabase
      .from('passage_completions')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false }),
  ])
  const { data: profile } = profileResult
  const { data: completions, error } = completionsResult

  const totalWordsWritten = (completions ?? []).reduce(
    (sum, c) => sum + (c.word_count ?? 0),
    0
  )

  const { currentStreak, longestStreak } = computeStreaksFromCompletions(completions ?? [])

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

  const passageMap = new Map(passages.map((p) => [p.id, p]))

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
            {completions?.length ?? 0} passage
            {(completions?.length ?? 0) !== 1 ? 's' : ''} completed
          </p>
        </header>

        <section className="profile-quotas" aria-label="Usage quotas and stats">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 className="profile-quotas-title" style={{ marginBottom: 0 }}>Your plan</h2>
            {entitlements.plan_id === 'free' ? (
              <Link href="/pricing" className="profile-card-link">
                Upgrade →
              </Link>
            ) : (
              <Link href="/pricing" className="profile-card-link">
                Manage plan →
              </Link>
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
                <span className="profile-quota-value">{profile?.total_passages_done ?? completions?.length ?? 0}</span>
              </div>
            </div>
            <StreakBadges currentStreak={currentStreak} />
          </div>
        </section>

        <CompletionHeatmap completions={completions ?? []} />

        {!completions?.length ? (
          <div className="profile-empty">
            <p>You haven&apos;t completed any passages yet.</p>
            <Link href="/" className="profile-empty-link">
              Browse passages and start writing
            </Link>
          </div>
        ) : (
          <ul className="profile-list">
            {(completions as PassageCompletion[]).map((c) => {
              const passage = passageMap.get(c.passage_id)
              const feedbackSummary = getFeedbackSummary(c.feedback)
              return (
                <li key={c.id} className="profile-card">
                  <div className="profile-card-header">
                    <span className="profile-card-category">
                      {passage
                        ? getCategoryLabel(passage.categoryId)
                        : 'Unknown'}
                    </span>
                    <time
                      className="profile-card-date"
                      dateTime={c.completed_at}
                    >
                      {formatDate(c.completed_at)}
                    </time>
                  </div>
                  <h2 className="profile-card-title">
                    {passage ? (
                      <>
                        <em>{passage.title}</em>
                        <span className="profile-card-work">
                          — {passage.author}, {passage.work}
                        </span>
                      </>
                    ) : (
                      <>Passage {c.passage_id}</>
                    )}
                  </h2>
                  {c.user_text && (
                    <div className="profile-card-user-text">
                      <span className="profile-card-label">Your rewrite</span>
                      <p className="profile-card-text">{c.user_text}</p>
                    </div>
                  )}
                  {feedbackSummary && (
                    <div className="profile-card-feedback">
                      <span className="profile-card-label">Feedback</span>
                      <p className="profile-card-text">{feedbackSummary}</p>
                    </div>
                  )}
                  <div className="profile-card-meta">
                    {c.word_count != null && (
                      <span className="profile-card-word-count">
                        {c.word_count} words
                      </span>
                    )}
                    <div className="profile-card-actions">
                      {passage && (
                        <Link href={`/extract/${passage.id}`} className="profile-card-link">
                          Try again →
                        </Link>
                      )}
                      <form action={deleteCompletionAction} className="profile-card-delete-form">
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className="profile-card-delete" title="Delete this submission">
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
