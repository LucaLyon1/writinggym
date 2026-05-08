'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { CraftCategory, ExtractAnalysis as ExtractAnalysisType, Segment } from '@/types/extract'
import { PublicAuthorAttribution } from '@/components/PublicAuthorAttribution'
import type { CompletionAuthorPayload } from '@/lib/completion-author'
import { CATEGORIES } from '@/lib/categories'
import { useSpeech } from '@/hooks/useSpeech'
import { FollowUpChat } from '@/components/FollowUpChat'

interface ExtractAnalysisProps {
  analysis: ExtractAnalysisType | null
  isLoading: boolean
  error: string | null
  passageId?: string
  constraint?: string
  categoryId?: string
  initialUserText?: string
}

type Phase = 'loading' | 'analyse' | 'write'

const CATEGORY_KEYS: CraftCategory[] = ['structure', 'voice', 'imagery', 'pacing']

function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

function AnnotatedText({
  segments,
  activeCategory,
  hoveredIndex,
  onHover,
}: {
  segments: Segment[]
  activeCategory: CraftCategory | null
  hoveredIndex: number | null
  onHover: (index: number | null) => void
}) {
  return (
    <p className="ea-text">
      {segments.map((seg, i) => {
        if (!seg.annotation) {
          return <span key={i}>{seg.text}</span>
        }

        const cat = seg.annotation.category
        const config = CATEGORIES[cat]
        const dimmed = activeCategory !== null && activeCategory !== cat
        const isHovered = hoveredIndex === i

        return (
          <span
            key={i}
            className="ea-highlight-wrap"
            onMouseEnter={() => onHover(i)}
            onMouseLeave={() => onHover(null)}
          >
            <span
              className="ea-highlight"
              style={{
                backgroundColor: dimmed ? 'transparent' : config.bg,
                borderBottom: dimmed ? 'none' : `2px solid ${config.border}`,
                opacity: dimmed ? 0.35 : 1,
                cursor: 'help',
                transition: 'all 0.2s ease',
                borderRadius: '2px',
                padding: '1px 2px',
                outline: isHovered ? `1px solid ${config.border}` : 'none',
              }}
            >
              {seg.text}
            </span>
            <span
              className="ea-seg-tooltip"
              style={{ borderTopColor: config.color }}
            >
              <span
                className="ea-annotation-label"
                style={{ color: config.color }}
              >
                {config.label}
              </span>
              <p className="ea-annotation-note">{seg.annotation.note}</p>
            </span>
          </span>
        )
      })}
    </p>
  )
}

function CategoryPills({
  active,
  onToggle,
}: {
  active: CraftCategory | null
  onToggle: (cat: CraftCategory) => void
}) {
  return (
    <div className="ea-pills">
      {CATEGORY_KEYS.map((key) => {
        const config = CATEGORIES[key]
        const isActive = active === key

        return (
          <button
            key={key}
            className="ea-pill"
            style={{
              backgroundColor: isActive ? config.bg : 'transparent',
              borderColor: isActive ? config.border : 'var(--line)',
              color: isActive ? config.color : 'var(--ink-muted)',
            }}
            onClick={() => onToggle(key)}
          >
            <span
              className="ea-pill-dot"
              style={{ backgroundColor: config.color }}
            />
            {config.label}
          </button>
        )
      })}
    </div>
  )
}

function ReadItButton({
  text,
  speak,
  stop,
  speaking,
  loading,
  disabled,
  categoryId,
}: {
  text: string
  speak: (t: string, categoryId?: string) => void
  stop: () => void
  speaking: boolean
  loading: boolean
  disabled?: boolean
  categoryId?: string
}) {
  const busy = speaking || loading
  const hasText = text.trim().length > 0

  if (busy) {
    return (
      <div className="ea-read-group">
        <button className="ea-read-btn ea-read-stop" onClick={stop}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <rect x="0" y="0" width="10" height="10" rx="1" />
          </svg>
          Stop
        </button>
        {loading && <span className="ea-read-status">Loading audio…</span>}
        {speaking && (
          <span className="ea-read-dots">
            <span className="ea-dot" />
            <span className="ea-dot" />
            <span className="ea-dot" />
          </span>
        )}
      </div>
    )
  }

  return (
    <button
      className="ea-read-btn"
      onClick={() => speak(text, categoryId)}
      disabled={disabled || !hasText}
    >
      <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
        <polygon points="2,1 13,7 2,13" />
      </svg>
      Read it
    </button>
  )
}

function AnalyseFollowBlock({
  analysis,
  onContinue,
}: {
  analysis: ExtractAnalysisType
  onContinue: () => void
}) {
  return (
    <section className="ea-analyse-follow" aria-label="Analysis summary">
      <h3 className="ea-sidebar-heading">What&rsquo;s happening here</h3>
      <div className="ea-summary-list">
        {analysis.summary.map((sentence, i) => (
          <p key={i} className="ea-summary-item">
            {sentence}
          </p>
        ))}
      </div>
      <button
        type="button"
        className="ea-ready-btn ea-analyse-cta"
        onClick={onContinue}
      >
        Continue to your writing exercise →
      </button>
    </section>
  )
}

function WriteConstraintBlock({
  constraint,
  onBackToAnalysis,
}: {
  constraint: string
  onBackToAnalysis: () => void
}) {
  return (
    <header className="ea-write-constraint">
      <div className="ea-write-constraint-top">
        <button
          type="button"
          className="ea-return-to-analysis"
          onClick={onBackToAnalysis}
        >
          ← Return to analysis
        </button>
      </div>
      <h3 className="ea-sidebar-heading">Your exercise</h3>
      <p className="ea-constraint-reminder">{constraint}</p>
    </header>
  )
}

interface DivergenceAnalysis {
  voice: string | null
  imagery: string | null
  structure: string | null
  pacing: string | null
}

interface UserFeedback {
  segments: ExtractAnalysisType['segments']
  strong_points: string[]
  weak_points: string[]
  analysis: string
  divergences?: DivergenceAnalysis
  next_step?: string
  verdict: string
  freePreview?: boolean
}

interface Submission {
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

// Old feedback had { scores, feedback (string), verdict, actionable_observation, divergences }
// New feedback has  { strong_points, weak_points, analysis, verdict, next_step, divergences }
function normalizeFeedback(raw: Record<string, unknown> | null): UserFeedback | null {
  if (!raw) return null
  return {
    segments: (raw.segments ?? []) as UserFeedback['segments'],
    strong_points: Array.isArray(raw.strong_points) ? raw.strong_points as string[] : [],
    weak_points: Array.isArray(raw.weak_points) ? raw.weak_points as string[] : [],
    analysis: typeof raw.analysis === 'string' ? raw.analysis : (typeof raw.feedback === 'string' ? raw.feedback : ''),
    divergences: (raw.divergences ?? undefined) as DivergenceAnalysis | undefined,
    next_step: typeof raw.next_step === 'string' ? raw.next_step : (typeof raw.actionable_observation === 'string' ? raw.actionable_observation : undefined),
    verdict: typeof raw.verdict === 'string' ? raw.verdict : '',
  }
}

function FeedbackPanel({ feedback }: { feedback: UserFeedback }) {
  const strongPoints = feedback.strong_points ?? []
  const weakPoints = feedback.weak_points ?? []

  return (
    <div className="ea-feedback-panel">
      <div className="ea-feedback-verdict">
        <p className="ea-verdict-text">{feedback.verdict}</p>
      </div>

      {(strongPoints.length > 0 || weakPoints.length > 0) && (
        <div className="ea-points-row">
          {strongPoints.length > 0 && (
            <div className="ea-points-group ea-strong-points">
              <h4 className="ea-points-heading">What works</h4>
              <ul className="ea-points-list">
                {strongPoints.map((point, i) => (
                  <li key={i} className="ea-point-item ea-point-strong">{point}</li>
                ))}
              </ul>
            </div>
          )}

          {weakPoints.length > 0 && (
            <div className="ea-points-group ea-weak-points">
              <h4 className="ea-points-heading">What to work on</h4>
              <ul className="ea-points-list">
                {weakPoints.map((point, i) => (
                  <li key={i} className="ea-point-item ea-point-weak">{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {feedback.analysis && (
        <div className="ea-feedback-analysis">
          <p className="ea-feedback-text">{feedback.analysis}</p>
        </div>
      )}
    </div>
  )
}

function SubmissionPreviewModal({
  submission,
  formatDate,
  onClose,
}: {
  submission: Submission | PublicSubmission
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

function WriteSidebar({
  analysis,
  submissions,
  submissionsLoading,
  onLoadSubmission,
  onDeleteSubmission,
  deletingId,
  formatDate,
  feedback,
  originalText,
  userText,
  publicSubmissions,
  publicSubmissionsLoading,
}: {
  analysis: ExtractAnalysisType
  submissions: Submission[]
  submissionsLoading: boolean
  onLoadSubmission: (s: Submission) => void
  onDeleteSubmission: (id: string) => void
  deletingId: string | null
  formatDate: (iso: string) => string
  feedback: UserFeedback | null
  originalText: string
  userText: string
  publicSubmissions: PublicSubmission[]
  publicSubmissionsLoading: boolean
}) {
  const [previewSubmission, setPreviewSubmission] = useState<Submission | PublicSubmission | null>(null)
  const [visibleCount, setVisibleCount] = useState(2)

  return (
    <div className="ea-sidebar">
      {feedback && (
        <>
          {feedback.freePreview && (
            <div className="ea-sidebar-section ea-free-preview-banner">
              <span className="ea-free-preview-label">Free preview</span>
              <p className="ea-free-preview-text">
                This was your free analysis. Start a 7-day free trial of Core to
                get feedback like this on every rewrite.
              </p>
              <a href="/pricing" className="ea-free-preview-cta">
                Start 7-day free trial →
              </a>
            </div>
          )}
          {feedback.divergences && (
            <div className="ea-sidebar-section ea-sidebar-divergences">
              <h3 className="ea-sidebar-heading">Where you diverged</h3>
              <div className="ea-divergence-list">
                {(Object.entries(feedback.divergences) as [keyof DivergenceAnalysis, string | null][])
                  .filter(([, text]) => text !== null)
                  .map(([dim, text]) => {
                    const config = CATEGORIES[dim]
                    return (
                      <div key={dim} className="ea-divergence-item" style={{ borderLeftColor: config.color }}>
                        <div className="ea-divergence-header">
                          <span className="ea-divergence-label" style={{ color: config.color }}>
                            {config.label}
                          </span>
                        </div>
                        <p className="ea-divergence-text">{text}</p>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {feedback.next_step && (
            <div className="ea-sidebar-section ea-sidebar-actionable">
              <h3 className="ea-sidebar-heading">Try this next time</h3>
              <p className="ea-actionable-text">{feedback.next_step}</p>
            </div>
          )}

          <div className="ea-sidebar-section ea-sidebar-feedback">
            <h3 className="ea-sidebar-heading">Full analysis</h3>
            <div className="ea-sidebar-feedback-content">
              <p className="ea-feedback-text">{feedback.analysis}</p>
            </div>
          </div>

          <div className="ea-sidebar-section">
            <FollowUpChat
              originalText={originalText}
              constraint={analysis.constraint}
              userText={userText}
              feedbackSummary={feedback.analysis}
            />
          </div>
        </>
      )}

      <div className="ea-sidebar-section ea-submissions-section">
        <h3 className="ea-sidebar-heading">Previous submissions</h3>
        {submissionsLoading ? (
          <p className="ea-submissions-loading">Loading…</p>
        ) : submissions.length === 0 ? (
          <p className="ea-submissions-empty">No saved drafts yet. Submit your writing to see it here — you can save without requesting analysis.</p>
        ) : (
          <>
          <ul className="ea-submissions-list">
            {submissions.slice(0, visibleCount).map((s) => (
              <li key={s.id} className="ea-submission-item">
                <div className="ea-submission-meta">
                  <span className="ea-submission-date">{formatDate(s.completed_at)}</span>
                  {s.word_count != null && (
                    <span className="ea-submission-words">{s.word_count} words</span>
                  )}
                </div>
                {s.user_text && (
                  <p className="ea-submission-preview">
                    {s.user_text.length > 100
                      ? s.user_text.slice(0, 100) + '…'
                      : s.user_text}
                  </p>
                )}
                <div className="ea-submission-actions">
                  {s.user_text && s.user_text.length > 100 && (
                    <button
                      type="button"
                      className="ea-submission-load"
                      onClick={() => setPreviewSubmission(s)}
                    >
                      Read
                    </button>
                  )}
                  <button
                    type="button"
                    className="ea-submission-load"
                    onClick={() => onLoadSubmission(s)}
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    className="ea-submission-delete"
                    onClick={() => onDeleteSubmission(s.id)}
                    disabled={deletingId === s.id}
                    title="Delete this submission"
                  >
                    {deletingId === s.id ? '…' : 'Delete'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {submissions.length > visibleCount && (
            <button
              type="button"
              className="ea-submissions-show-more"
              onClick={() => setVisibleCount((n) => n + 2)}
            >
              Show more ({submissions.length - visibleCount} remaining)
            </button>
          )}
          </>
        )}
      </div>

      <div className="ea-sidebar-section ea-public-submissions-section">
        <h3 className="ea-sidebar-heading">Other writers</h3>
        {publicSubmissionsLoading ? (
          <p className="ea-submissions-loading">Loading…</p>
        ) : publicSubmissions.length === 0 ? (
          <p className="ea-submissions-empty">No public rewrites yet. Be the first to share yours.</p>
        ) : (
          <ul className="ea-submissions-list">
            {publicSubmissions.map((s) => (
              <li key={s.id} className="ea-submission-item ea-public-submission-item">
                <div className="ea-submission-meta ea-public-submission-meta">
                  <PublicAuthorAttribution author={s} />
                  <span className="ea-submission-date">{formatDate(s.completed_at)}</span>
                  {s.word_count != null && (
                    <span className="ea-submission-words">{s.word_count} words</span>
                  )}
                </div>
                {s.user_text && (
                  <p className="ea-public-submission-text">
                    {s.user_text.length > 100
                      ? s.user_text.slice(0, 100) + '…'
                      : s.user_text}
                  </p>
                )}
                <div className="ea-submission-actions">
                  <UpvoteButton
                    completionId={s.id}
                    initialCount={s.upvote_count}
                    initialUpvoted={s.viewer_has_upvoted}
                  />
                  {s.user_text && s.user_text.length > 100 && (
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
      </div>

      {previewSubmission && (
        <SubmissionPreviewModal
          submission={previewSubmission}
          formatDate={formatDate}
          onClose={() => setPreviewSubmission(null)}
        />
      )}
    </div>
  )
}

export function ExtractAnalysis({ analysis, isLoading, error, passageId, constraint, categoryId, initialUserText }: ExtractAnalysisProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [phase, setPhase] = useState<Phase>(initialUserText ? 'write' : 'loading')
  const [activeCategory, setActiveCategory] = useState<CraftCategory | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [userText, setUserText] = useState(initialUserText ?? '')
  const [feedback, setFeedback] = useState<UserFeedback | null>(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [publicSubmissions, setPublicSubmissions] = useState<PublicSubmission[]>([])
  const [publicSubmissionsLoading, setPublicSubmissionsLoading] = useState(false)
  const [showFeedbackCard, setShowFeedbackCard] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [submittedCompletionId, setSubmittedCompletionId] = useState<string | null>(null)
  const [submittedTextSnapshot, setSubmittedTextSnapshot] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)
  const { speak, stop, speaking, loading: speechLoading } = useSpeech()
  const feedbackCardRef = useRef<HTMLDivElement>(null)

  const fetchSubmissions = useCallback(async () => {
    if (!passageId || !constraint) return
    setSubmissionsLoading(true)
    try {
      const res = await fetch(
        `/api/completions?passageId=${encodeURIComponent(passageId)}&constraint=${encodeURIComponent(constraint)}`
      )
      if (res.ok) {
        const data = (await res.json()) as Submission[]
        setSubmissions(data)
      }
    } catch {
      setSubmissions([])
    } finally {
      setSubmissionsLoading(false)
    }
  }, [passageId, constraint])

  const fetchPublicSubmissions = useCallback(async () => {
    if (!passageId || !constraint) return
    setPublicSubmissionsLoading(true)
    try {
      const res = await fetch(
        `/api/completions/public?passageId=${encodeURIComponent(passageId)}&constraint=${encodeURIComponent(constraint)}`
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
  }, [passageId, constraint])

  useEffect(() => {
    if (phase === 'write' && passageId && constraint) {
      fetchSubmissions()
      fetchPublicSubmissions()
    }
  }, [phase, passageId, constraint, fetchSubmissions, fetchPublicSubmissions])

  function handleLoadSubmission(s: Submission) {
    const text = s.user_text ?? ''
    setUserText(text)
    setFeedback(normalizeFeedback(s.feedback))
    setFeedbackError(null)
    setSubmittedTextSnapshot(text.trim())
    setSubmittedCompletionId(s.id)
  }

  async function handleDeleteSubmission(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/completions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSubmissions((prev) => prev.filter((s) => s.id !== id))
        if (id === submittedCompletionId) {
          setSubmittedCompletionId(null)
          setSubmittedTextSnapshot('')
        }
      }
    } finally {
      setDeletingId(null)
    }
  }

  const wordCount = useMemo(() => countWords(userText), [userText])

  const isSubmittedVersion =
    submittedCompletionId !== null && userText.trim() === submittedTextSnapshot
  const canSubmit =
    !submitLoading &&
    userText.trim().length > 0 &&
    !isSubmittedVersion
  const canAnalyze =
    !feedbackLoading &&
    !submitLoading &&
    feedback == null &&
    submittedCompletionId != null &&
    isSubmittedVersion &&
    userText.trim().length >= 50

  const fullText = useMemo(
    () => analysis?.segments.map((s) => s.text).join('') ?? '',
    [analysis]
  )

  async function handleSubmit() {
    if (!analysis || !userText.trim()) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const nextPath = pathname ?? '/'
      try {
        sessionStorage.setItem(
          'proselab-draft',
          JSON.stringify({ pathname: nextPath, userText: userText.trim() })
        )
      } catch {
        // sessionStorage may be unavailable
      }
      const signupUrl = `/signup?next=${encodeURIComponent(nextPath)}`
      router.push(signupUrl)
      return
    }
    if (!passageId) return
    setFeedbackError(null)
    setSubmitLoading(true)
    try {
      const res = await fetch('/api/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passageId,
          constraint: analysis.constraint,
          userText: userText.trim(),
          wordCount,
        }),
      })
      if (res.status === 401) {
        const nextPath = pathname ?? '/'
        try {
          sessionStorage.setItem(
            'proselab-draft',
            JSON.stringify({ pathname: nextPath, userText: userText.trim() })
          )
        } catch {
          // sessionStorage may be unavailable
        }
        router.push(`/signup?next=${encodeURIComponent(nextPath)}`)
        return
      }
      if (res.status === 403) {
        const data = (await res.json()) as { requiresUpgrade?: boolean; error?: string }
        if (data.requiresUpgrade) {
          setShowUpgradePrompt(true)
          return
        }
      }
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to save your writing')
      }
      const data = (await res.json()) as { id: string; success: boolean }
      setSubmittedCompletionId(data.id)
      setSubmittedTextSnapshot(userText.trim())
      fetchSubmissions()
      setShowShareModal(true)
      try {
        sessionStorage.removeItem('proselab-draft')
      } catch {
        // sessionStorage may be unavailable
      }
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to save your writing')
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
    if (!analysis || !userText.trim()) return
    if (userText.trim().length < 50) {
      setFeedbackError('Write at least 50 characters before requesting feedback.')
      return
    }
    if (!submittedCompletionId) {
      setFeedbackError('Submit your writing before requesting analysis.')
      return
    }
    if (userText.trim() !== submittedTextSnapshot) {
      setFeedbackError('Submit your writing before requesting analysis.')
      return
    }
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const nextPath = pathname ?? '/'
      try {
        sessionStorage.setItem(
          'proselab-draft',
          JSON.stringify({ pathname: nextPath, userText: userText.trim() })
        )
      } catch {
        // sessionStorage may be unavailable
      }
      const signupUrl = `/signup?next=${encodeURIComponent(nextPath)}`
      router.push(signupUrl)
      return
    }
    setFeedbackError(null)
    setFeedback(null)
    setFeedbackLoading(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userText: userText.trim(),
          originalText: fullText,
          constraint: analysis.constraint,
          passageId: passageId ?? undefined,
          completionId: submittedCompletionId,
        }),
      })
      if (res.status === 401) {
        const nextPath = pathname ?? '/'
        try {
          sessionStorage.setItem(
            'proselab-draft',
            JSON.stringify({ pathname: nextPath, userText: userText.trim() })
          )
        } catch {
          // sessionStorage may be unavailable
        }
        router.push(`/signup?next=${encodeURIComponent(nextPath)}`)
        return
      }
      if (res.status === 403) {
        const data = (await res.json()) as { requiresUpgrade?: boolean; error?: string }
        if (data.requiresUpgrade) {
          setShowUpgradePrompt(true)
          setFeedbackLoading(false)
          return
        }
      }
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to get feedback')
      }
      const data = (await res.json()) as UserFeedback
      setFeedback(data)
      setShowFeedbackCard(true)
      fetchSubmissions()
      try {
        sessionStorage.removeItem('proselab-draft')
      } catch {
        // sessionStorage may be unavailable
      }
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to get feedback')
    } finally {
      setFeedbackLoading(false)
    }
  }

  async function handleTest() {
    if (!analysis) return
    setTestLoading(true)
    setFeedbackError(null)
    try {
      const res = await fetch('/api/example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: fullText,
          constraint: analysis.constraint,
          passageId: passageId ?? undefined,
        }),
      })
      const data = (await res.json()) as { example?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate example')
      if (data.example) {
        setUserText(data.example)
        setFeedback(null)
        setSubmittedCompletionId(null)
        setSubmittedTextSnapshot('')
      }
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to generate example')
    } finally {
      setTestLoading(false)
    }
  }

  function formatSubmissionDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  useEffect(() => {
    if (analysis && phase === 'loading') {
      setPhase('analyse')
    }
  }, [analysis, phase])

  function handleCategoryToggle(cat: CraftCategory) {
    setActiveCategory((prev) => (prev === cat ? null : cat))
  }

  useEffect(() => {
    if (showFeedbackCard) {
      function handleKey(e: KeyboardEvent) {
        if (e.key === 'Escape') setShowFeedbackCard(false)
      }
      document.addEventListener('keydown', handleKey)
      return () => document.removeEventListener('keydown', handleKey)
    }
  }, [showFeedbackCard])

  if (isLoading) {
    return (
      <div className="ea-root">
        <div className="ea-loading">
          <p className="ea-loading-text">Analysing the extract…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="ea-root">
        <div className="ea-loading">
          <p className="ea-error-text">{error}</p>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return null
  }

  if (phase === 'analyse') {
    return (
      <div className="ea-root">
        <div className="ea-analyse-layout">
          <div className="ea-analyse-unified">
            <main className="ea-main ea-analyse-main">
              <div className="ea-toolbar">
                <CategoryPills
                  active={activeCategory}
                  onToggle={handleCategoryToggle}
                />
                <ReadItButton
                  text={fullText}
                  speak={speak}
                  stop={stop}
                  speaking={speaking}
                  loading={speechLoading}
                  categoryId={categoryId}
                />
              </div>
              <div className="ea-extract-quote">
                <AnnotatedText
                  segments={analysis.segments}
                  activeCategory={activeCategory}
                  hoveredIndex={hoveredIndex}
                  onHover={setHoveredIndex}
                />
              </div>
            </main>
            <AnalyseFollowBlock
              analysis={analysis}
              onContinue={() => setPhase('write')}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ea-root">
      <div className="ea-analyse-layout ea-write-layout">
        <div className="ea-write-main">
          <div className="ea-analyse-unified ea-write-unified">
          <WriteConstraintBlock
            constraint={analysis.constraint}
            onBackToAnalysis={() => setPhase('analyse')}
          />
          <main className="ea-main ea-analyse-main">
            <div className="ea-toolbar">
              <CategoryPills
                active={activeCategory}
                onToggle={handleCategoryToggle}
              />
              <ReadItButton
                text={fullText}
                speak={speak}
                stop={stop}
                speaking={speaking}
                loading={speechLoading}
                categoryId={categoryId}
              />
            </div>
            <div className="ea-extract-quote">
              <AnnotatedText
                segments={analysis.segments}
                activeCategory={activeCategory}
                hoveredIndex={hoveredIndex}
                onHover={setHoveredIndex}
              />
            </div>
          </main>
          <section className="ea-write-follow" aria-label="Your response">
            {feedbackLoading && (
              <p className="ea-feedback-loading">Analysing your writing…</p>
            )}
            {feedbackError && !feedbackLoading && (
              <p className="ea-feedback-error">{feedbackError}</p>
            )}
            <textarea
              className="ea-textarea"
              value={userText}
              onChange={(e) => {
                const v = e.target.value
                setUserText(v)
                if (v.trim() !== submittedTextSnapshot) {
                  setSubmittedCompletionId(null)
                  setFeedback(null)
                }
              }}
              placeholder="Begin here…"
            />
            <div className="ea-write-footer">
              <span className="ea-word-count">{wordCount} words</span>
              <ReadItButton
                text={userText}
                speak={speak}
                stop={stop}
                speaking={speaking}
                loading={speechLoading}
                disabled={!userText.trim()}
                categoryId={categoryId}
              />
              <button
                type="button"
                className="ea-test-btn"
                onClick={handleTest}
                disabled={testLoading || feedbackLoading || submitLoading}
                title="Generate an example passage for this constraint"
              >
                {testLoading ? 'Generating…' : 'Test'}
              </button>
              <button
                type="button"
                className="ea-submit-btn"
                onClick={handleSubmit}
                disabled={!canSubmit}
                title="Save to your account. Required before you can run analysis."
              >
                {submitLoading ? 'Saving…' : 'Submit'}
              </button>
              <button
                className="ea-analyze-btn"
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                title="Submit the current text first, then you can get AI feedback on it"
              >
                {feedbackLoading ? 'Analysing…' : 'Analyse my writing'}
              </button>
              {feedback && (
                <button
                  className="ea-scorecard-btn"
                  onClick={() => setShowFeedbackCard(true)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M8 12h8M8 8h8M8 16h4" />
                  </svg>
                  Feedback
                </button>
              )}
            </div>
          </section>
          </div>
        </div>
        <aside className="ea-write-sidebar-col">
          <WriteSidebar
            analysis={analysis}
            submissions={submissions}
            submissionsLoading={submissionsLoading}
            onLoadSubmission={handleLoadSubmission}
            onDeleteSubmission={handleDeleteSubmission}
            deletingId={deletingId}
            formatDate={formatSubmissionDate}
            feedback={feedback}
            originalText={fullText}
            userText={userText}
            publicSubmissions={publicSubmissions}
            publicSubmissionsLoading={publicSubmissionsLoading}
          />
        </aside>
      </div>
      {showFeedbackCard && feedback && analysis && (
        <div className="sc-overlay" onClick={() => setShowFeedbackCard(false)}>
          <div
            className="sc-card"
            ref={feedbackCardRef}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="sc-close" onClick={() => setShowFeedbackCard(false)} aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="2" y1="2" x2="12" y2="12" />
                <line x1="12" y1="2" x2="2" y2="12" />
              </svg>
            </button>

            <div className="sc-header">
              <span className="sc-brand">PROSELAB</span>
              <span className="sc-divider" />
              <span className="sc-type">Writing Feedback</span>
            </div>

            <div className="sc-hero">
              <div className="sc-hero-info">
                <p className="sc-verdict">{feedback.verdict}</p>
              </div>
            </div>

            {((feedback.strong_points ?? []).length > 0 || (feedback.weak_points ?? []).length > 0) && (
              <div className="sc-points-section">
                {(feedback.strong_points ?? []).length > 0 && (
                  <div className="sc-points-group sc-strong-points">
                    <h3 className="sc-points-heading">What works</h3>
                    <ul className="sc-points-list">
                      {(feedback.strong_points ?? []).map((point, i) => (
                        <li key={i} className="sc-point-item sc-point-strong">{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {(feedback.weak_points ?? []).length > 0 && (
                  <div className="sc-points-group sc-weak-points">
                    <h3 className="sc-points-heading">What to work on</h3>
                    <ul className="sc-points-list">
                      {(feedback.weak_points ?? []).map((point, i) => (
                        <li key={i} className="sc-point-item sc-point-weak">{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {feedback.divergences && (
              <div className="sc-divergences">
                {(Object.entries(feedback.divergences) as [keyof DivergenceAnalysis, string | null][])
                  .filter(([, text]) => text !== null)
                  .map(([dim, text]) => {
                    const config = CATEGORIES[dim]
                    return (
                      <div key={dim} className="sc-divergence-item" style={{ borderLeftColor: config.color }}>
                        <span className="sc-divergence-label" style={{ color: config.color }}>
                          {config.label}
                        </span>
                        <p className="sc-divergence-text">{text}</p>
                      </div>
                    )
                  })}
              </div>
            )}

            {feedback.next_step && (
              <div className="sc-actionable">
                <span className="sc-actionable-label">Try next time</span>
                <p className="sc-actionable-text">{feedback.next_step}</p>
              </div>
            )}

            <div className="sc-constraint">
              <span className="sc-constraint-label">Exercise</span>
              <p className="sc-constraint-text">{analysis.constraint}</p>
            </div>

            <div className="sc-footer">
              <span className="sc-watermark">proselab — learn to write by imitation</span>
            </div>
          </div>
        </div>
      )}
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
            <h2 className="share-modal-title">Share your rewrite?</h2>
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
      {showUpgradePrompt && (
        <div className="sc-overlay" onClick={() => setShowUpgradePrompt(false)}>
          <div className="upgrade-prompt" onClick={(e) => e.stopPropagation()}>
            <button
              className="sc-close"
              onClick={() => setShowUpgradePrompt(false)}
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="2" y1="2" x2="12" y2="12" />
                <line x1="12" y1="2" x2="2" y2="12" />
              </svg>
            </button>
            <h2 className="upgrade-prompt-title">You&rsquo;ve used your free analysis</h2>
            <p className="upgrade-prompt-text">
              Hope it was useful. Keep practicing with unlimited detailed feedback
              on every rewrite — start a 7-day free trial of Core.
            </p>
            <ul className="upgrade-prompt-features">
              <li>Unlimited AI feedback on every rewrite</li>
              <li>Divergence analysis — where and why your instincts differ from the master</li>
              <li>One specific, actionable next step per session</li>
              <li>Follow-up chat to deepen understanding</li>
            </ul>
            <a href="/pricing" className="upgrade-prompt-btn">
              Start 7-day free trial
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
