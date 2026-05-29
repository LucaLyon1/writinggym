'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import posthog from 'posthog-js'
import type { FeedbackForScoreCard, DivergenceAnalysis } from '@/components/ScoreCard'
import { PublicAuthorAttribution } from '@/components/PublicAuthorAttribution'
import type { CompletionAuthorPayload } from '@/lib/completion-author'
import { CraftPromptGallery } from '@/components/CraftPromptGallery'
import { craftPlaygroundPrompts } from '@/data/playground-prompts'
import { CATEGORIES } from '@/lib/categories'
import { createClient } from '@/lib/supabase/client'
import { playgroundPassageId } from '@/lib/playground-passage'
import { SidebarNav } from '@/components/AppSidebar'
import { CollapsibleResponse } from '@/components/CollapsibleResponse'

const FREETEXT_ID = '__freetext__'
const FREETEXT_CONSTRAINT = 'Write anything — a scene, a memory, a description.'

type PgTab = 'write' | 'feedback' | 'result' | 'community'

interface AuthorAnalysis {
  author: string
  confidence: number
  traits: string[]
  excerpt_highlight: string
  suggestion: string
}

interface PlaygroundSubmission {
  id: string
  user_text: string | null
  feedback: Record<string, unknown> | null
  word_count: number | null
  completed_at: string
}

interface PublicSubmission extends CompletionAuthorPayload {
  id: string
  user_text: string | null
  word_count: number | null
  completed_at: string
  upvote_count: number
  viewer_has_upvoted: boolean
}

function parseStoredAuthorAnalysis(
  raw: Record<string, unknown> | null
): AuthorAnalysis | null {
  if (!raw || typeof raw !== 'object') return null
  if (typeof raw.author !== 'string' || !Array.isArray(raw.traits)) return null
  if (!raw.traits.every((t) => typeof t === 'string')) return null
  if (typeof raw.excerpt_highlight !== 'string') return null
  if (typeof raw.suggestion !== 'string') return null
  if (typeof raw.confidence !== 'number') return null
  return raw as unknown as AuthorAnalysis
}

function UpvoteButton({
  completionId,
  initialCount,
  initialUpvoted,
}: {
  completionId: string
  initialCount: number
  initialUpvoted: boolean
}) {
  const [count, setCount] = useState(initialCount)
  const [upvoted, setUpvoted] = useState(initialUpvoted)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch('/api/upvotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionId }),
      })
      if (res.ok) {
        const data = (await res.json()) as { upvoted: boolean; count: number }
        setUpvoted(data.upvoted)
        setCount(data.count)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      className={`upvote-btn${upvoted ? ' upvote-btn-active' : ''}`}
      onClick={toggle}
      disabled={loading}
      title={upvoted ? 'Remove upvote' : 'Upvote this rewrite'}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill={upvoted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
      {count > 0 ? count : null}
    </button>
  )
}

function SubmissionPreviewModal({
  submission,
  formatDate,
  onClose,
}: {
  submission: PlaygroundSubmission | PublicSubmission
  formatDate: (iso: string) => string
  onClose: () => void
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="sc-overlay" onClick={onClose}>
      <div className="submission-preview-modal" onClick={(e) => e.stopPropagation()}>
        <button className="sc-close" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="2" y1="2" x2="12" y2="12" />
            <line x1="12" y1="2" x2="2" y2="12" />
          </svg>
        </button>
        <div className="submission-preview-meta">
          {'upvote_count' in submission && (
            <PublicAuthorAttribution author={submission} className="public-author-attribution submission-preview-author" />
          )}
          <span className="submission-preview-date">{formatDate(submission.completed_at)}</span>
          {submission.word_count != null && (
            <span className="submission-preview-words">{submission.word_count} words</span>
          )}
          {'upvote_count' in submission && (
            <UpvoteButton
              completionId={submission.id}
              initialCount={submission.upvote_count}
              initialUpvoted={submission.viewer_has_upvoted}
            />
          )}
        </div>
        <p className="submission-preview-text">{submission.user_text ?? ''}</p>
      </div>
    </div>
  )
}

export default function PlaygroundPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<PgTab>('write')
  const [text, setText] = useState('')
  const [analysis, setAnalysis] = useState<AuthorAnalysis | null>(null)
  const [feedback, setFeedback] = useState<FeedbackForScoreCard | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submittedCompletionId, setSubmittedCompletionId] = useState<
    string | null
  >(null)
  const [submittedTextSnapshot, setSubmittedTextSnapshot] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<PlaygroundSubmission[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [publicSubmissions, setPublicSubmissions] = useState<PublicSubmission[]>([])
  const [publicSubmissionsLoading, setPublicSubmissionsLoading] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)
  const [previewSubmission, setPreviewSubmission] = useState<PlaygroundSubmission | PublicSubmission | null>(null)

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const isFreetextMode = selectedPrompt === FREETEXT_ID
  const prompt = !isFreetextMode
    ? craftPlaygroundPrompts.find((p) => p.id === selectedPrompt)
    : null

  const currentPassageId = isFreetextMode
    ? playgroundPassageId(FREETEXT_ID)
    : prompt ? playgroundPassageId(prompt.id) : null
  const currentConstraint = isFreetextMode
    ? FREETEXT_CONSTRAINT
    : prompt?.prompt ?? null

  const fetchSubmissions = useCallback(async () => {
    if (!currentPassageId || !currentConstraint) return
    setSubmissionsLoading(true)
    try {
      const res = await fetch(
        `/api/completions?passageId=${encodeURIComponent(currentPassageId)}&constraint=${encodeURIComponent(currentConstraint)}`
      )
      if (!res.ok) {
        setSubmissions([])
        return
      }
      const data = (await res.json()) as PlaygroundSubmission[]
      setSubmissions(data)
    } catch {
      setSubmissions([])
    } finally {
      setSubmissionsLoading(false)
    }
  }, [currentPassageId, currentConstraint])

  const fetchPublicSubmissions = useCallback(async () => {
    if (!currentPassageId || !currentConstraint) return
    setPublicSubmissionsLoading(true)
    try {
      const res = await fetch(
        `/api/completions/public?passageId=${encodeURIComponent(currentPassageId)}&constraint=${encodeURIComponent(currentConstraint)}`
      )
      if (res.ok) {
        const data = (await res.json()) as PublicSubmission[]
        setPublicSubmissions(data)
      }
    } catch {
      setPublicSubmissions([])
    } finally {
      setPublicSubmissionsLoading(false)
    }
  }, [currentPassageId, currentConstraint])

  useEffect(() => {
    if (selectedPrompt && (activeTab === 'write' || activeTab === 'community')) {
      fetchSubmissions()
      fetchPublicSubmissions()
    }
  }, [selectedPrompt, activeTab, fetchSubmissions, fetchPublicSubmissions])

  function formatSubmissionDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function handleLoadSubmission(s: PlaygroundSubmission) {
    const t = s.user_text ?? ''
    setText(t)
    setSubmittedTextSnapshot(t.trim())
    setSubmittedCompletionId(s.id)
    setAnalysis(parseStoredAuthorAnalysis(s.feedback))
    setError(null)
    setActiveTab('write')
  }

  const isSubmittedVersion =
    submittedCompletionId !== null && text.trim() === submittedTextSnapshot
  const canSubmit =
    !submitLoading && text.trim().length > 0 && !isSubmittedVersion
  const canAnalyze =
    !isLoading &&
    !submitLoading &&
    analysis === null &&
    submittedCompletionId != null &&
    isSubmittedVersion &&
    wordCount >= 30

  async function handleSubmit() {
    if (!currentPassageId || !currentConstraint || !text.trim()) return
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      const nextPath = pathname ?? '/playground'
      try {
        sessionStorage.setItem(
          'proselab-draft',
          JSON.stringify({ pathname: nextPath, userText: text.trim() })
        )
      } catch {
        // sessionStorage may be unavailable
      }
      router.push(`/signup?next=${encodeURIComponent(nextPath)}`)
      return
    }

    setError(null)
    setSubmitLoading(true)
    try {
      const res = await fetch('/api/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passageId: currentPassageId,
          constraint: currentConstraint,
          userText: text.trim(),
          wordCount,
        }),
      })
      if (res.status === 401) {
        const nextPath = pathname ?? '/playground'
        try {
          sessionStorage.setItem(
            'proselab-draft',
            JSON.stringify({ pathname: nextPath, userText: text.trim() })
          )
        } catch {
          // sessionStorage may be unavailable
        }
        router.push(`/signup?next=${encodeURIComponent(nextPath)}`)
        return
      }
      if (res.status === 403) {
        const data = (await res.json()) as {
          requiresUpgrade?: boolean
          error?: string
        }
        if (data.requiresUpgrade) {
          setError(
            data.error ??
              'Upgrade to save more sessions, or try again tomorrow.'
          )
          return
        }
      }
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to save your writing')
      }
      const data = (await res.json()) as { id: string; success: boolean }
      setSubmittedCompletionId(data.id)
      setSubmittedTextSnapshot(text.trim())
      posthog.capture('playground_writing_submitted', {
        prompt_id: isFreetextMode ? FREETEXT_ID : prompt?.id,
        word_count: wordCount,
        completion_id: data.id,
      })
      void fetchSubmissions()
      setShowShareModal(true)
      try {
        sessionStorage.removeItem('proselab-draft')
      } catch {
        // sessionStorage may be unavailable
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save your writing'
      )
    } finally {
      setSubmitLoading(false)
    }
  }

  async function handleShare(isPublic: boolean) {
    if (!submittedCompletionId) return
    setShareLoading(true)
    try {
      await fetch(`/api/completions/${submittedCompletionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: isPublic }),
      })
    } finally {
      setShareLoading(false)
      setShowShareModal(false)
    }
  }

  async function handleAnalyze() {
    if (!prompt || wordCount < 30) return
    if (!submittedCompletionId) {
      setError('Save your writing before requesting analysis.')
      return
    }
    if (text.trim() !== submittedTextSnapshot) {
      setError('Save your writing before requesting analysis.')
      return
    }

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      const nextPath = pathname ?? '/playground'
      try {
        sessionStorage.setItem(
          'proselab-draft',
          JSON.stringify({ pathname: nextPath, userText: text.trim() })
        )
      } catch {
        // sessionStorage may be unavailable
      }
      router.push(`/signup?next=${encodeURIComponent(nextPath)}`)
      return
    }

    setIsLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      const res = await fetch('/api/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          prompt: prompt.prompt,
          passageId: playgroundPassageId(prompt.id),
          completionId: submittedCompletionId,
        }),
      })

      const data = await res.json()

      if (res.status === 401) {
        const nextPath = pathname ?? '/playground'
        try {
          sessionStorage.setItem(
            'proselab-draft',
            JSON.stringify({ pathname: nextPath, userText: text.trim() })
          )
        } catch {
          // sessionStorage may be unavailable
        }
        router.push(`/signup?next=${encodeURIComponent(nextPath)}`)
        return
      }

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        return
      }

      setAnalysis(data as AuthorAnalysis)
      setActiveTab('result')
      posthog.capture('playground_analysis_requested', {
        prompt_id: prompt.id,
        word_count: wordCount,
        author_match: (data as AuthorAnalysis).author,
        confidence: (data as AuthorAnalysis).confidence,
      })
      void fetchSubmissions()
      try {
        sessionStorage.removeItem('proselab-draft')
      } catch {
        // sessionStorage may be unavailable
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleFreetextFeedback() {
    if (wordCount < 30) return
    setIsLoading(true)
    setError(null)
    setFeedback(null)

    try {
      const res = await fetch('/api/playground-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        return
      }

      setFeedback(data as FeedbackForScoreCard)
      setActiveTab('feedback')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleReset() {
    setSelectedPrompt(null)
    setActiveTab('write')
    setText('')
    setAnalysis(null)
    setFeedback(null)
    setError(null)
    setSubmittedCompletionId(null)
    setSubmittedTextSnapshot('')
    setSubmissions([])
    setPublicSubmissions([])
    setShowShareModal(false)
    setPreviewSubmission(null)
  }

  /* ── Gallery view ── */
  if (!selectedPrompt) {
    return (
      <div className="home-gallery-shell">
        <div className="home-gallery-main">
          <CraftPromptGallery
            onSelect={(p) => setSelectedPrompt(p.id)}
            onFreetextSelect={() => setSelectedPrompt(FREETEXT_ID)}
          />
        </div>
      </div>
    )
  }

  /* ── Writing session — ea-page-layout ── */
  const busy = isLoading || submitLoading

  const hasFeedback = isFreetextMode ? !!feedback : !!analysis
  const hasResult = !isFreetextMode && !!analysis

  // Center content based on active tab
  let centerContent: React.ReactNode = null

  if (activeTab === 'write') {
    centerContent = (
      <section className="ea-stage ea-stage-write">
        <header className="ea-stage-head ea-stage-head-write">
          <h2 className="ea-stage-title">
            {isFreetextMode ? 'Free Writing' : 'Prompt'}
          </h2>
        </header>
        <div className="ea-stage-body ea-stage-body-write">
          <div className="ea-write-prompt">
            <p className="ea-write-prompt-text">
              {isFreetextMode
                ? 'Write anything — a scene, a memory, a description. At least 30 words.'
                : prompt?.prompt}
            </p>
          </div>
          {error && !isLoading && (
            <p className="ea-feedback-error">{error}</p>
          )}
          <textarea
            className="ea-textarea ea-textarea-prominent"
            placeholder="Begin here…"
            value={text}
            onChange={(e) => {
              const v = e.target.value
              setText(v)
              if (v.trim() !== submittedTextSnapshot) {
                setSubmittedCompletionId(null)
                if (!isFreetextMode) setAnalysis(null)
                if (isFreetextMode) setFeedback(null)
              }
            }}
            disabled={busy}
            autoFocus
          />
        </div>
        <footer className="ea-stage-foot">
          <span className="ea-word-count">
            {wordCount} word{wordCount !== 1 ? 's' : ''}
          </span>
          <div className="ea-stage-foot-actions">
            {isFreetextMode ? (
              <>
                <button
                  type="button"
                  className="ea-submit-btn"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  title="Save to your account."
                >
                  {submitLoading ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  className="ea-analyze-btn"
                  onClick={handleFreetextFeedback}
                  disabled={isLoading || wordCount < 30}
                >
                  {isLoading ? 'Analysing…' : 'Get feedback'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="ea-submit-btn"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  title="Save to your account — required before you can run analysis."
                >
                  {submitLoading ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  className="ea-analyze-btn"
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                  title="Save the current text first, then you can run analysis."
                >
                  {isLoading ? 'Analysing…' : 'Analyze'}
                </button>
                {hasResult && (
                  <button
                    type="button"
                    className="ea-scorecard-btn"
                    onClick={() => setActiveTab('result')}
                  >
                    Result
                  </button>
                )}
              </>
            )}
          </div>
        </footer>
      </section>
    )
  } else if (activeTab === 'feedback' && feedback) {
    centerContent = (
      <section className="ea-stage ea-stage-feedback">
        <header className="ea-stage-head">
          <h2 className="ea-stage-title">Feedback</h2>
        </header>
        <CollapsibleResponse label="Your writing" text={submittedTextSnapshot || text} />
        <div className="ea-stage-body ea-stage-body-feedback">
          {feedback.verdict && (
            <div className="ea-feedback-verdict">
              <p>{feedback.verdict}</p>
            </div>
          )}

          {((feedback.strong_points ?? []).length > 0 ||
            (feedback.weak_points ?? []).length > 0) && (
            <div className="ea-feedback-points">
              {(feedback.strong_points ?? []).length > 0 && (
                <div className="ea-feedback-group">
                  <h3 className="ea-feedback-group-heading">What works</h3>
                  <ul className="ea-feedback-list">
                    {(feedback.strong_points ?? []).map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(feedback.weak_points ?? []).length > 0 && (
                <div className="ea-feedback-group">
                  <h3 className="ea-feedback-group-heading">What to work on</h3>
                  <ul className="ea-feedback-list">
                    {(feedback.weak_points ?? []).map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {feedback.divergences && (
            <div className="ea-feedback-divergences">
              {(
                Object.entries(feedback.divergences) as [
                  keyof DivergenceAnalysis,
                  string | null,
                ][]
              )
                .filter(([, t]) => t !== null)
                .map(([dim, t]) => {
                  const config = CATEGORIES[dim as keyof typeof CATEGORIES]
                  if (!config) return null
                  return (
                    <div
                      key={dim}
                      className="ea-feedback-divergence-item"
                      style={{ borderLeftColor: config.color }}
                    >
                      <span
                        className="ea-feedback-divergence-label"
                        style={{ color: config.color }}
                      >
                        {config.label}
                      </span>
                      <p className="ea-feedback-divergence-text">{t}</p>
                    </div>
                  )
                })}
            </div>
          )}

          {feedback.next_step && (
            <div className="ea-feedback-next">
              <h3 className="ea-feedback-group-heading">Try next time</h3>
              <p>{feedback.next_step}</p>
            </div>
          )}
        </div>
      </section>
    )
  } else if (activeTab === 'result' && analysis) {
    centerContent = (
      <section className="ea-stage">
        <header className="ea-stage-head">
          <h2 className="ea-stage-title">Result</h2>
        </header>
        <div className="ea-stage-body">
          <div className="pg-result pg-result-embedded">
            <div className="pg-result-header">
              <span className="pg-result-label">You sound like</span>
              <h2 className="pg-result-author">{analysis.author}</h2>
              <span className="pg-confidence">
                {analysis.confidence}% match
              </span>
            </div>

            <div className="pg-result-section">
              <h3 className="pg-result-heading">Shared traits</h3>
              <ul className="pg-traits">
                {analysis.traits.map((trait, i) => (
                  <li key={i} className="pg-trait">
                    {trait}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pg-result-section">
              <h3 className="pg-result-heading">This passage especially</h3>
              <blockquote className="pg-highlight">
                {analysis.excerpt_highlight}
              </blockquote>
            </div>

            <div className="pg-result-section">
              <h3 className="pg-result-heading">To grow your voice</h3>
              <p className="pg-suggestion">{analysis.suggestion}</p>
            </div>
          </div>
        </div>
      </section>
    )
  } else if (activeTab === 'community') {
    centerContent = (
      <section className="ea-stage ea-stage-community">
        <header className="ea-stage-head">
          <h2 className="ea-stage-title">Community</h2>
        </header>
        <div className="ea-stage-body">
          <div className="ea-community">
            <section className="ea-community-section">
              <h3 className="ea-community-heading">Your submissions</h3>
              {submissionsLoading ? (
                <p className="ea-submissions-loading">Loading…</p>
              ) : submissions.length === 0 ? (
                <p className="ea-submissions-empty">
                  You haven&rsquo;t submitted anything for this prompt yet.
                </p>
              ) : (
                <ul className="ea-community-list">
                  {submissions.map((s) => (
                    <li key={s.id} className="ea-community-item ea-community-item-own">
                      <button
                        type="button"
                        className="ea-community-item-body"
                        onClick={() => handleLoadSubmission(s)}
                        title="Open this submission"
                      >
                        <div className="ea-submission-meta">
                          <span className="ea-submission-date">
                            {formatSubmissionDate(s.completed_at)}
                          </span>
                          {s.word_count != null && (
                            <span className="ea-submission-words">
                              {s.word_count} words
                            </span>
                          )}
                        </div>
                        {s.user_text && (
                          <p className="ea-submission-preview">
                            {s.user_text.length > 240
                              ? s.user_text.slice(0, 240) + '…'
                              : s.user_text}
                          </p>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="ea-community-section">
              <h3 className="ea-community-heading">Other writers</h3>
              {publicSubmissionsLoading ? (
                <p className="ea-submissions-loading">Loading…</p>
              ) : publicSubmissions.length === 0 ? (
                <p className="ea-submissions-empty">
                  No public submissions yet. Be the first to share yours.
                </p>
              ) : (
                <ul className="ea-community-list">
                  {publicSubmissions.map((s) => (
                    <li key={s.id} className="ea-community-item">
                      <div className="ea-submission-meta ea-public-submission-meta">
                        <PublicAuthorAttribution author={s} />
                        <span className="ea-submission-date">
                          {formatSubmissionDate(s.completed_at)}
                        </span>
                        {s.word_count != null && (
                          <span className="ea-submission-words">
                            {s.word_count} words
                          </span>
                        )}
                      </div>
                      {s.user_text && (
                        <p className="ea-public-submission-text">
                          {s.user_text.length > 240
                            ? s.user_text.slice(0, 240) + '…'
                            : s.user_text}
                        </p>
                      )}
                      <div className="ea-submission-actions">
                        <UpvoteButton
                          completionId={s.id}
                          initialCount={s.upvote_count}
                          initialUpvoted={s.viewer_has_upvoted}
                        />
                        {s.user_text && s.user_text.length > 240 && (
                          <button
                            type="button"
                            className="ea-submission-load"
                            onClick={() => setPreviewSubmission(s)}
                          >
                            Read
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </section>
    )
  }

  // Right column content
  let rightContent: React.ReactNode = null

  if (!isFreetextMode && prompt) {
    rightContent = (
      <>
        <div className="ea-right-card">
          <h3 className="ea-right-card-heading">
            {CATEGORIES[prompt.craft].label} · {prompt.focus}
          </h3>
          <p className="ea-right-card-prose">{prompt.title}</p>
        </div>
        <div className="ea-right-card ea-tutorial-card">
          <h3 className="ea-right-card-heading">How this works</h3>
          <ol className="ea-tutorial-list">
            <li className="ea-tutorial-item">
              <span className="ea-tutorial-num">1</span>
              <span className="ea-tutorial-text">
                Read the prompt and draft your version in the textarea.
              </span>
            </li>
            <li className="ea-tutorial-item">
              <span className="ea-tutorial-num">2</span>
              <span className="ea-tutorial-text">
                Save when you&rsquo;re happy, then run Analyze to see which author your voice resembles.
              </span>
            </li>
            <li className="ea-tutorial-item">
              <span className="ea-tutorial-num">3</span>
              <span className="ea-tutorial-text">
                Share your writing with the community and read what others wrote.
              </span>
            </li>
          </ol>
        </div>
      </>
    )
  } else {
    rightContent = (
      <div className="ea-right-card ea-tutorial-card">
        <h3 className="ea-right-card-heading">How this works</h3>
        <ol className="ea-tutorial-list">
          <li className="ea-tutorial-item">
            <span className="ea-tutorial-num">1</span>
            <span className="ea-tutorial-text">
              Write anything you like — a scene, a memory, a description.
            </span>
          </li>
          <li className="ea-tutorial-item">
            <span className="ea-tutorial-num">2</span>
            <span className="ea-tutorial-text">
              Hit &ldquo;Get feedback&rdquo; for craft analysis, or &ldquo;Save&rdquo; to share with the community.
            </span>
          </li>
          <li className="ea-tutorial-item">
            <span className="ea-tutorial-num">3</span>
            <span className="ea-tutorial-text">
              Read what others wrote in the Community tab.
            </span>
          </li>
        </ol>
      </div>
    )
  }

  return (
    <div className="analysis-view">
    <div className="ea-root">
      <div className="ea-page-layout">
        <aside className="ea-left-sidebar">
          <button type="button" className="ea-left-back" onClick={handleReset}>
            ← Playground
          </button>
          <nav className="ea-left-nav" aria-label="Sections">
            <button
              type="button"
              className={`ea-left-nav-btn${activeTab === 'write' ? ' is-active' : ''}`}
              onClick={() => setActiveTab('write')}
            >
              Prompt
            </button>
            {isFreetextMode ? (
              <button
                type="button"
                className={`ea-left-nav-btn${activeTab === 'feedback' ? ' is-active' : ''}`}
                onClick={() => setActiveTab('feedback')}
                disabled={!hasFeedback}
                title={
                  hasFeedback
                    ? 'View your feedback'
                    : 'Run "Get feedback" first'
                }
              >
                Feedback
              </button>
            ) : (
              <button
                type="button"
                className={`ea-left-nav-btn${activeTab === 'result' ? ' is-active' : ''}`}
                onClick={() => setActiveTab('result')}
                disabled={!hasResult}
                title={
                  hasResult
                    ? 'View your result'
                    : 'Run "Analyze" first'
                }
              >
                Result
              </button>
            )}
            <button
              type="button"
              className={`ea-left-nav-btn${activeTab === 'community' ? ' is-active' : ''}`}
              onClick={() => setActiveTab('community')}
            >
              Community
            </button>
          </nav>
          <SidebarNav />
        </aside>
        <main className="ea-center-col">{centerContent}</main>
        <aside className="ea-right-col" aria-label="Context">
          {rightContent}
        </aside>
      </div>
    </div>

    {showShareModal && (
      <div className="sc-overlay" onClick={() => !shareLoading && setShowShareModal(false)}>
        <div className="share-modal" onClick={(e) => e.stopPropagation()}>
          <button
            className="sc-close"
            onClick={() => setShowShareModal(false)}
            disabled={shareLoading}
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="2" y1="2" x2="12" y2="12" />
              <line x1="12" y1="2" x2="2" y2="12" />
            </svg>
          </button>
          <div className="share-modal-icon" aria-hidden>✦</div>
          <h2 className="share-modal-title">Share your writing?</h2>
          <p className="share-modal-text">
            Make this submission visible to others. You can change this at any time from your profile.
          </p>
          <div className="share-modal-actions">
            <button
              className="share-modal-btn share-modal-btn-primary"
              onClick={() => handleShare(true)}
              disabled={shareLoading}
            >
              {shareLoading ? 'Saving…' : 'Share publicly'}
            </button>
            <button
              className="share-modal-btn share-modal-btn-ghost"
              onClick={() => handleShare(false)}
              disabled={shareLoading}
            >
              Keep private
            </button>
          </div>
        </div>
      </div>
    )}

    {previewSubmission && (
      <SubmissionPreviewModal
        submission={previewSubmission}
        formatDate={formatSubmissionDate}
        onClose={() => setPreviewSubmission(null)}
      />
    )}

    </div>
  )
}
