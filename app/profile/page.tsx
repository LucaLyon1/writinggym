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

type PassageCompletion = Tables<'passage_completions'>

type Entitlements = {
  plan_label?: string
  daily_passage_limit?: number | null
  passages_used_today?: number
  can_access_all_passages?: boolean
  can_access_packs?: boolean
  can_export?: boolean
  can_save_rewrites?: boolean
  has_progress_tracking?: boolean
}

async function fetchEntitlements(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<Entitlements> {
  const { data: rpcData } = await supabase.rpc('get_user_entitlements', { p_user_id: userId })
  if (rpcData && typeof rpcData === 'object') {
    const e = rpcData as Record<string, unknown>
    return {
      plan_label: typeof e.plan_label === 'string' ? e.plan_label : undefined,
      daily_passage_limit: typeof e.daily_passage_limit === 'number' ? e.daily_passage_limit : e.daily_passage_limit === null ? null : undefined,
      passages_used_today: typeof e.passages_used_today === 'number' ? e.passages_used_today : undefined,
      can_access_all_passages: typeof e.can_access_all_passages === 'boolean' ? e.can_access_all_passages : undefined,
      can_access_packs: typeof e.can_access_packs === 'boolean' ? e.can_access_packs : undefined,
      can_export: typeof e.can_export === 'boolean' ? e.can_export : undefined,
      can_save_rewrites: typeof e.can_save_rewrites === 'boolean' ? e.can_save_rewrites : undefined,
      has_progress_tracking: typeof e.has_progress_tracking === 'boolean' ? e.has_progress_tracking : undefined,
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  const planId = sub?.plan_id ?? null
  let plan: { label: string; daily_passage_limit: number | null } | null = null

  if (planId) {
    const { data: p } = await supabase
      .from('plans')
      .select('label, daily_passage_limit')
      .eq('id', planId)
      .single()
    plan = p
  }

  if (!plan) {
    const { data: freePlan } = await supabase
      .from('plans')
      .select('label, daily_passage_limit')
      .order('price_cents', { ascending: true })
      .limit(1)
      .maybeSingle()
    plan = freePlan
  }

  const { data: dailyStat } = await supabase
    .from('daily_stats')
    .select('passages_practiced')
    .eq('user_id', userId)
    .eq('stat_date', today)
    .maybeSingle()

  const passagesUsedToday = dailyStat?.passages_practiced ?? 0
  const dailyLimit = plan?.daily_passage_limit ?? null

  return {
    plan_label: plan?.label ?? 'Free',
    daily_passage_limit: dailyLimit,
    passages_used_today: passagesUsedToday,
  }
}

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
    fetchEntitlements(supabase, user.id),
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
          <Link href="/lab" className="profile-back-link">
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
        <Link href="/lab" className="profile-back-link">
          ← Back to main screen
        </Link>
        <header className="profile-header">
          <h1 className="profile-title">Your submissions</h1>
          <p className="profile-subtitle">
            {completions?.length ?? 0} passage
            {(completions?.length ?? 0) !== 1 ? 's' : ''} completed
          </p>
        </header>

        <section className="profile-quotas" aria-label="Usage quotas and stats">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 className="profile-quotas-title" style={{ marginBottom: 0 }}>Your plan</h2>
            <Link href="/pricing" className="profile-card-link">
              View pricing →
            </Link>
          </div>
          <div className="profile-quotas-grid">
            <div className="profile-quota-card">
              <span className="profile-quota-label">Plan</span>
              <span className="profile-quota-value">{entitlements.plan_label ?? 'Free'}</span>
            </div>
            {entitlements.daily_passage_limit != null && (
              <div className="profile-quota-card">
                <span className="profile-quota-label">Passages today</span>
                <span className="profile-quota-value">
                  {entitlements.passages_used_today ?? 0} / {entitlements.daily_passage_limit}
                </span>
                <div className="profile-quota-bar">
                  <div
                    className="profile-quota-bar-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        entitlements.daily_passage_limit > 0
                          ? ((entitlements.passages_used_today ?? 0) / entitlements.daily_passage_limit) * 100
                          : 0
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
            {entitlements.daily_passage_limit == null && (
              <div className="profile-quota-card">
                <span className="profile-quota-label">Passages today</span>
                <span className="profile-quota-value">{entitlements.passages_used_today ?? 0} (unlimited)</span>
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
            <Link href="/lab" className="profile-empty-link">
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
                        <Link href={`/lab?passage=${passage.id}`} className="profile-card-link">
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
