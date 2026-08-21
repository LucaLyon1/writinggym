'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { CraftCategory, ExtractAnalysis as ExtractAnalysisType, Segment } from '@/types/extract'
import { PublicAuthorAttribution } from '@/components/PublicAuthorAttribution'
import type { CompletionAuthorPayload } from '@/lib/completion-author'
import { CATEGORIES } from '@/lib/categories'
import { useSpeech } from '@/hooks/useSpeech'
import { SidebarNav } from '@/components/AppSidebar'
import { useSidebar } from '@/components/SidebarContext'
import { CollapsibleResponse } from '@/components/CollapsibleResponse'

interface ExtractAnalysisProps {
  analysis: ExtractAnalysisType | null
  isLoading: boolean
  error: string | null
  passageId?: string
  constraint?: string
  categoryId?: string
  initialUserText?: string
  author?: string
  title?: string
  difficulty?: string
  categoryLabel?: string
  onBack?: () => void
}

type Phase = 'loading' | 'analyse' | 'write' | 'feedback' | 'community'
type Tab = 'analyse' | 'write' | 'feedback' | 'community'

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
          </span>
        )
      })}
    </p>
  )
}

function AnnotationPanel({ segment }: { segment: Segment | null }) {
  if (!segment || !segment.annotation) {
    return (
      <div className="ea-annotation-panel ea-annotation-panel-empty">
        <p className="ea-annotation-panel-hint">
          Hover a highlighted phrase to see what&rsquo;s going on with it.
        </p>
      </div>
    )
  }
  const config = CATEGORIES[segment.annotation.category]
  return (
    <div
      className="ea-annotation-panel"
      style={{ borderTopColor: config.color }}
    >
      <span
        className="ea-annotation-panel-label"
        style={{ color: config.color }}
      >
        {config.label}
      </span>
      <blockquote className="ea-annotation-panel-quote">
        “{segment.text.trim()}”
      </blockquote>
      <p className="ea-annotation-panel-note">{segment.annotation.note}</p>
    </div>
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

function LeftSidebar({
  activeTab,
  onTabChange,
  onBack,
  feedbackAvailable,
}: {
  activeTab: Tab
  onTabChange: (t: Tab) => void
  onBack?: () => void
  feedbackAvailable: boolean
}) {
  const { open } = useSidebar()
  return (
    <aside className={`ea-left-sidebar${open ? ' is-open' : ''}`}>
      {onBack && (
        <button type="button" className="ea-left-back" onClick={onBack}>
          ← Library
        </button>
      )}
      <nav className="ea-left-nav" aria-label="Sections">
        <button
          type="button"
          className={`ea-left-nav-btn${activeTab === 'analyse' ? ' is-active' : ''}`}
          onClick={() => onTabChange('analyse')}
        >
          Analyse
        </button>
        <button
          type="button"
          className={`ea-left-nav-btn${activeTab === 'write' ? ' is-active' : ''}`}
          onClick={() => onTabChange('write')}
        >
          Exercise
        </button>
        <button
          type="button"
          className={`ea-left-nav-btn${activeTab === 'feedback' ? ' is-active' : ''}`}
          onClick={() => onTabChange('feedback')}
          disabled={!feedbackAvailable}
          title={feedbackAvailable ? 'View your feedback' : 'Run "Analyse my writing" first'}
        >
          Feedback
        </button>
        <button
          type="button"
          className={`ea-left-nav-btn${activeTab === 'community' ? ' is-active' : ''}`}
          onClick={() => onTabChange('community')}
        >
          Community
        </button>
      </nav>
      <SidebarNav />
    </aside>
  )
}

function TutorialCard({ activeTab }: { activeTab: Tab }) {
  const steps =
    activeTab === 'analyse'
      ? [
          'Hover any highlighted phrase to read why it works.',
          'Filter the dimensions with the pills above the extract.',
          'When you’re ready, take the exercise and write your own version.',
        ]
      : activeTab === 'write'
      ? [
          "Re-read the constraint on the right — it’s your brief.",
          "Draft your version in the textarea. Use Test for an example.",
          "Save when you’re happy, then run Analyse my writing for feedback.",
        ]
      : [
          'Your own rewrites sit at the top — click one to revisit its analysis.',
          'Upvote what you love from other writers.',
          'Read different takes on the same constraint to widen your range.',
        ]
  return (
    <div className="ea-right-card ea-tutorial-card">
      <h3 className="ea-right-card-heading">How this page works</h3>
      <ol className="ea-tutorial-list">
        {steps.map((s, i) => (
          <li key={i} className="ea-tutorial-item">
            <span className="ea-tutorial-num">{i + 1}</span>
            <span className="ea-tutorial-text">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function ReferencePassageCard({
  segments,
  activeCategory,
  onToggleCategory,
  fullText,
  speak,
  stop,
  speaking,
  loading,
  categoryId,
}: {
  segments: Segment[]
  activeCategory: CraftCategory | null
  onToggleCategory: (cat: CraftCategory) => void
  fullText: string
  speak: (t: string, categoryId?: string) => void
  stop: () => void
  speaking: boolean
  loading: boolean
  categoryId?: string
}) {
  return (
    <div className="ea-right-card ea-reference-card">
      <div className="ea-reference-head">
        <h3 className="ea-right-card-heading">Reference</h3>
        <ReadItButton
          text={fullText}
          speak={speak}
          stop={stop}
          speaking={speaking}
          loading={loading}
          categoryId={categoryId}
        />
      </div>
      <CategoryPills active={activeCategory} onToggle={onToggleCategory} />
      <div className="ea-reference-prose">
        <AnnotatedText
          segments={segments}
          activeCategory={activeCategory}
          hoveredIndex={null}
          onHover={() => {}}
        />
      </div>
    </div>
  )
}

function ExtractInfoCard({
  author,
  title,
  difficulty,
  categoryLabel,
}: {
  author?: string
  title?: string
  difficulty?: string
  categoryLabel?: string
}) {
  if (!author && !title && !categoryLabel && !difficulty) return null
  return (
    <div className="ea-right-card ea-extract-info-card">
      {(author || title) && (
        <div className="ea-extract-info-title">
          {author && <p className="ea-extract-info-author">{author}</p>}
          {title && <em className="ea-extract-info-work">{title}</em>}
        </div>
      )}
      {(categoryLabel || difficulty) && (
        <div className="ea-extract-info-tags">
          {categoryLabel && (
            <span className="gym-category-badge">{categoryLabel}</span>
          )}
          {difficulty && (
            <span className={`tile-difficulty tile-difficulty-${difficulty}`}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function CommunityView({
  submissions,
  submissionsLoading,
  publicSubmissions,
  publicSubmissionsLoading,
  onOpenOwn,
  formatDate,
}: {
  submissions: Submission[]
  submissionsLoading: boolean
  publicSubmissions: PublicSubmission[]
  publicSubmissionsLoading: boolean
  onOpenOwn: (s: Submission) => void
  formatDate: (iso: string) => string
}) {
  const [previewSubmission, setPreviewSubmission] = useState<Submission | PublicSubmission | null>(null)

  return (
    <div className="ea-community">
      <section className="ea-community-section">
        <h3 className="ea-community-heading">Your rewrites</h3>
        {submissionsLoading ? (
          <p className="ea-submissions-loading">Loading…</p>
        ) : submissions.length === 0 ? (
          <p className="ea-submissions-empty">You haven&rsquo;t submitted a rewrite yet for this passage.</p>
        ) : (
          <ul className="ea-community-list">
            {submissions.map((s) => (
              <li key={s.id} className="ea-community-item ea-community-item-own">
                <button
                  type="button"
                  className="ea-community-item-body"
                  onClick={() => onOpenOwn(s)}
                  title="Open this rewrite and its analysis"
                >
                  <div className="ea-submission-meta">
                    <span className="ea-submission-date">{formatDate(s.completed_at)}</span>
                    {s.word_count != null && (
                      <span className="ea-submission-words">{s.word_count} words</span>
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
          <p className="ea-submissions-empty">No public rewrites yet. Be the first to share yours.</p>
        ) : (
          <ul className="ea-community-list">
            {publicSubmissions.map((s) => (
              <li key={s.id} className="ea-community-item">
                <div className="ea-submission-meta ea-public-submission-meta">
                  <PublicAuthorAttribution author={s} />
                  <span className="ea-submission-date">{formatDate(s.completed_at)}</span>
                  {s.word_count != null && (
                    <span className="ea-submission-words">{s.word_count} words</span>
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

export function ExtractAnalysis({
  analysis,
  isLoading,
  error,
  passageId,
  constraint,
  categoryId,
  initialUserText,
  author,
  title,
  difficulty,
  categoryLabel,
  onBack,
}: ExtractAnalysisProps) {
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
  const [publicSubmissions, setPublicSubmissions] = useState<PublicSubmission[]>([])
  const [publicSubmissionsLoading, setPublicSubmissionsLoading] = useState(false)
  const [submittedCompletionId, setSubmittedCompletionId] = useState<string | null>(null)
  const [submittedTextSnapshot, setSubmittedTextSnapshot] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)
  const { speak, stop, speaking, loading: speechLoading } = useSpeech()

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
    if ((phase === 'write' || phase === 'community') && passageId && constraint) {
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
      setFeedbackError('Save your writing before requesting analysis.')
      return
    }
    if (userText.trim() !== submittedTextSnapshot) {
      setFeedbackError('Save your writing before requesting analysis.')
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
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to get feedback')
      }
      const data = (await res.json()) as UserFeedback
      setFeedback(data)
      setPhase('feedback')
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

  const activeTab: Tab = phase === 'loading' ? 'analyse' : phase

  function handleTabChange(t: Tab) {
    setPhase(t)
  }

  function handleOpenOwnFromCommunity(s: Submission) {
    handleLoadSubmission(s)
    setPhase('write')
  }

  const analyseCenter = analysis ? (
    <section className="ea-stage ea-stage-analyse">
      <header className="ea-stage-head">
        <h2 className="ea-stage-title">Analysis</h2>
        <div className="ea-stage-actions">
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
      </header>
      <div className="ea-stage-body ea-stage-body-prose">
        <AnnotatedText
          segments={analysis.segments}
          activeCategory={activeCategory}
          hoveredIndex={hoveredIndex}
          onHover={setHoveredIndex}
        />
        <AnnotationPanel
          segment={hoveredIndex !== null ? analysis.segments[hoveredIndex] ?? null : null}
        />
      </div>
      <footer className="ea-stage-foot ea-stage-foot-analyse">
        <div className="ea-stage-foot-summary">
          <span className="ea-stage-foot-summary-label">What&rsquo;s happening here</span>
          <div className="ea-stage-foot-summary-list">
            {analysis.summary.map((sentence, i) => (
              <p key={i} className="ea-stage-foot-summary-item">{sentence}</p>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="ea-ready-btn ea-stage-foot-cta"
          onClick={() => setPhase('write')}
        >
          Open the exercise →
        </button>
      </footer>
    </section>
  ) : null

  const writeCenter = analysis ? (
    <section className="ea-stage ea-stage-write">
      <header className="ea-stage-head ea-stage-head-write">
        <h2 className="ea-stage-title">Exercise</h2>
      </header>
      <div className="ea-stage-body ea-stage-body-write">
        <div className="ea-write-prompt">
          <p className="ea-write-prompt-text">{analysis.constraint}</p>
        </div>
        {feedbackLoading && (
          <p className="ea-feedback-loading">Analysing your writing…</p>
        )}
        {feedbackError && !feedbackLoading && (
          <p className="ea-feedback-error">{feedbackError}</p>
        )}
        <textarea
          className="ea-textarea ea-textarea-prominent"
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
          autoFocus
        />
      </div>
      <footer className="ea-stage-foot">
        <span className="ea-word-count">{wordCount} words</span>
        <div className="ea-stage-foot-actions">
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
            title="Save to your account — required before you can run analysis."
          >
            {submitLoading ? 'Saving…' : 'Save'}
          </button>
          <button
            className="ea-analyze-btn"
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            title="Save the current text first, then you can get AI feedback on it"
          >
            {feedbackLoading ? 'Analysing…' : 'Analyse my writing'}
          </button>
          {feedback && (
            <button
              className="ea-scorecard-btn"
              onClick={() => setPhase('feedback')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M8 12h8M8 8h8M8 16h4" />
              </svg>
              Feedback
            </button>
          )}
        </div>
      </footer>
    </section>
  ) : null

  const communityCenter = (
    <section className="ea-stage ea-stage-community">
      <header className="ea-stage-head">
        <h2 className="ea-stage-title">Community rewrites</h2>
      </header>
      <div className="ea-stage-body">
        <CommunityView
          submissions={submissions}
          submissionsLoading={submissionsLoading}
          publicSubmissions={publicSubmissions}
          publicSubmissionsLoading={publicSubmissionsLoading}
          onOpenOwn={handleOpenOwnFromCommunity}
          formatDate={formatSubmissionDate}
        />
      </div>
    </section>
  )

  const feedbackCenter = feedback && analysis ? (
    <section className="ea-stage ea-stage-feedback">
      <header className="ea-stage-head">
        <h2 className="ea-stage-title">Feedback</h2>
      </header>
      <CollapsibleResponse label="Your response" text={submittedTextSnapshot || userText} />
      <div className="ea-stage-body ea-stage-body-feedback">

          {feedback.verdict && (
            <div className="ea-feedback-verdict">
              <p>{feedback.verdict}</p>
            </div>
          )}

          {((feedback.strong_points ?? []).length > 0 || (feedback.weak_points ?? []).length > 0) && (
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
              <h3 className="ea-feedback-group-heading">Divergences</h3>
              {(Object.entries(feedback.divergences) as [keyof DivergenceAnalysis, string | null][])
                .filter(([, text]) => text !== null)
                .map(([dim, text]) => {
                  const config = CATEGORIES[dim]
                  return (
                    <div key={dim} className="ea-feedback-divergence-item" style={{ borderLeftColor: config.color }}>
                      <span className="ea-feedback-divergence-label" style={{ color: config.color }}>
                        {config.label}
                      </span>
                      <p className="ea-feedback-divergence-text">{text}</p>
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
  ) : null

  let centerContent: React.ReactNode = null
  if (isLoading || phase === 'loading') {
    centerContent = (
      <section className="ea-stage ea-stage-loading">
        <p className="ea-loading-text">Analysing the extract…</p>
      </section>
    )
  } else if (error) {
    centerContent = (
      <section className="ea-stage ea-stage-loading">
        <p className="ea-error-text">{error}</p>
      </section>
    )
  } else if (!analysis) {
    centerContent = null
  } else if (phase === 'analyse') {
    centerContent = analyseCenter
  } else if (phase === 'write') {
    centerContent = writeCenter
  } else if (phase === 'feedback') {
    centerContent = feedbackCenter
  } else if (phase === 'community') {
    centerContent = communityCenter
  }

  let rightContent: React.ReactNode = (
    <ExtractInfoCard
      author={author}
      title={title}
      difficulty={difficulty}
      categoryLabel={categoryLabel}
    />
  )
  if (analysis) {
    if (phase === 'analyse') {
      rightContent = (
        <>
          <ExtractInfoCard
            author={author}
            title={title}
            difficulty={difficulty}
            categoryLabel={categoryLabel}
          />
          <TutorialCard activeTab="analyse" />
        </>
      )
    } else if (phase === 'write') {
      rightContent = (
        <>
          <ExtractInfoCard
            author={author}
            title={title}
            difficulty={difficulty}
            categoryLabel={categoryLabel}
          />
          <ReferencePassageCard
            segments={analysis.segments}
            activeCategory={activeCategory}
            onToggleCategory={handleCategoryToggle}
            fullText={fullText}
            speak={speak}
            stop={stop}
            speaking={speaking}
            loading={speechLoading}
            categoryId={categoryId}
          />
          <TutorialCard activeTab="write" />
        </>
      )
    } else if (phase === 'feedback') {
      rightContent = (
        <>
          <ExtractInfoCard
            author={author}
            title={title}
            difficulty={difficulty}
            categoryLabel={categoryLabel}
          />
          <ReferencePassageCard
            segments={analysis.segments}
            activeCategory={activeCategory}
            onToggleCategory={handleCategoryToggle}
            fullText={fullText}
            speak={speak}
            stop={stop}
            speaking={speaking}
            loading={speechLoading}
            categoryId={categoryId}
          />
        </>
      )
    } else if (phase === 'community') {
      rightContent = (
        <>
          <ExtractInfoCard
            author={author}
            title={title}
            difficulty={difficulty}
            categoryLabel={categoryLabel}
          />
          <TutorialCard activeTab="community" />
        </>
      )
    }
  }

  return (
    <div className="ea-root">
      <div className="ea-page-layout">
        <LeftSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onBack={onBack}
          feedbackAvailable={!!feedback}
        />
        <main className="ea-center-col">{centerContent}</main>
        <aside className="ea-right-col" aria-label="Context">
          {rightContent}
        </aside>
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
    </div>
  )
}
