import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { passages, categories } from '@/data/passages'
import type { Tables } from '@/types/database.types'
import { deleteCompletion } from '@/app/actions/completions'
import { CompletionHeatmap } from '@/components/CompletionHeatmap'

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

  const { data: completions, error } = await supabase
    .from('passage_completions')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })

  if (error) {
    return (
      <div className="profile-root">
        <div className="profile-inner">
          <Link href="/gym" className="profile-back-link">
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
        <Link href="/gym" className="profile-back-link">
          ← Back to main screen
        </Link>
        <header className="profile-header">
          <h1 className="profile-title">Your submissions</h1>
          <p className="profile-subtitle">
            {completions?.length ?? 0} passage
            {(completions?.length ?? 0) !== 1 ? 's' : ''} completed
          </p>
        </header>

        <CompletionHeatmap completions={completions ?? []} />

        {!completions?.length ? (
          <div className="profile-empty">
            <p>You haven&apos;t completed any passages yet.</p>
            <Link href="/gym" className="profile-empty-link">
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
                        <Link href={`/gym?passage=${passage.id}`} className="profile-card-link">
                          Try again →
                        </Link>
                      )}
                      <form action={deleteCompletion} className="profile-card-delete-form">
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
