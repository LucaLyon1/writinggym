'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { CraftCategory, ExtractAnalysis as ExtractAnalysisType, Segment } from '@/types/extract'
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
            className="ea-highlight"
            style={{
              backgroundColor: dimmed ? 'transparent' : config.bg,
              borderBottom: dimmed ? 'none' : `2px solid ${config.border}`,
              opacity: dimmed ? 0.35 : 1,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderRadius: '2px',
              padding: '1px 2px',
              outline: isHovered ? `1px solid ${config.border}` : 'none',
            }}
            onMouseEnter={() => onHover(i)}
            onMouseLeave={() => onHover(null)}
          >
            {seg.text}
          </span>
        )
      })}
    </p>
  )
}

function AnnotationPanel({ segments, hoveredIndex }: { segments: Segment[]; hoveredIndex: number | null }) {
  if (hoveredIndex === null || !segments[hoveredIndex]?.annotation) {
    return (
      <div className="ea-annotation-placeholder">
        Hover a highlighted passage to see the annotation →
      </div>
    )
  }

  const seg = segments[hoveredIndex]
  const annotation = seg.annotation!
  const config = CATEGORIES[annotation.category]

  return (
    <div
      className="ea-annotation-card"
      style={{ borderLeftColor: config.color }}
    >
      <span
        className="ea-annotation-label"
        style={{ color: config.color }}
      >
        {config.label}
      </span>
      <p className="ea-annotation-note">{annotation.note}</p>
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

function SummarySidebar({
  analysis,
  onReady,
}: {
  analysis: ExtractAnalysisType
  onReady: () => void
}) {
  return (
    <aside className="ea-sidebar">
      <div className="ea-sidebar-section">
        <h3 className="ea-sidebar-heading">What&rsquo;s happening here</h3>
        <div className="ea-summary-list">
          {analysis.summary.map((sentence, i) => (
            <p key={i} className="ea-summary-item">{sentence}</p>
          ))}
        </div>
      </div>

      <div className="ea-sidebar-section">
        <h3 className="ea-sidebar-heading">Craft categories</h3>
        <div className="ea-legend">
          {CATEGORY_KEYS.map((key) => {
            const config = CATEGORIES[key]
            return (
              <div key={key} className="ea-legend-item">
                <span
                  className="ea-legend-swatch"
                  style={{ backgroundColor: config.color }}
                />
                <div>
                  <span className="ea-legend-label">{config.label}</span>
                  <span className="ea-legend-desc">{config.description}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="ea-constraint-card">
        <span className="ea-constraint-label">Your exercise</span>
        <p className="ea-constraint-text">{analysis.constraint}</p>
        <button className="ea-ready-btn" onClick={onReady}>
          I&rsquo;m ready to write →
        </button>
      </div>
    </aside>
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

function WriteSidebar({
  analysis,
  submissions,
  submissionsLoading,
  onLoadSubmission,
  onDeleteSubmission,
  deletingId,
  formatDate,
  feedback,
  feedbackLoading,
  feedbackError,
  saveError,
  originalText,
  userText,
}: {
  analysis: ExtractAnalysisType
  submissions: Submission[]
  submissionsLoading: boolean
  onLoadSubmission: (s: Submission) => void
  onDeleteSubmission: (id: string) => void
  deletingId: string | null
  formatDate: (iso: string) => string
  feedback: UserFeedback | null
  feedbackLoading: boolean
  feedbackError: string | null
  saveError: string | null
  originalText: string
  userText: string
}) {
  const annotatedSegments = analysis.segments.filter((s) => s.annotation)

  return (
    <aside className="ea-sidebar">
      <div className="ea-sidebar-section">
        <h3 className="ea-sidebar-heading">Your exercise</h3>
        <p className="ea-constraint-reminder">{analysis.constraint}</p>
      </div>

      {feedbackLoading && (
        <div className="ea-sidebar-section">
          <p className="ea-feedback-loading">Analysing your writing…</p>
        </div>
      )}

      {feedbackError && (
        <div className="ea-sidebar-section">
          <p className="ea-feedback-error">{feedbackError}</p>
        </div>
      )}

      {saveError && (
        <div className="ea-sidebar-section">
          <p className="ea-feedback-error">{saveError}</p>
        </div>
      )}

      {feedback && !feedbackLoading && (
        <>
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

      <div className="ea-sidebar-section">
        <h3 className="ea-sidebar-heading">Annotations</h3>
        <div className="ea-annotations-compact">
          {annotatedSegments.map((seg, i) => {
            const config = CATEGORIES[seg.annotation!.category]
            return (
              <div key={i} className="ea-compact-note">
                <span
                  className="ea-compact-label"
                  style={{ color: config.color }}
                >
                  {config.label}
                </span>
                <p className="ea-compact-text">{seg.annotation!.note}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="ea-sidebar-section ea-submissions-section">
        <h3 className="ea-sidebar-heading">Previous submissions</h3>
        {submissionsLoading ? (
          <p className="ea-submissions-loading">Loading…</p>
        ) : submissions.length === 0 ? (
          <p className="ea-submissions-empty">No submissions yet. Get feedback on your writing to see it here.</p>
        ) : (
          <ul className="ea-submissions-list">
            {submissions.map((s) => (
              <li key={s.id} className="ea-submission-item">
                <div className="ea-submission-meta">
                  <span className="ea-submission-date">{formatDate(s.completed_at)}</span>
                  {s.word_count != null && (
                    <span className="ea-submission-words">{s.word_count} words</span>
                  )}
                </div>
                <div className="ea-submission-actions">
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
        )}
      </div>
    </aside>
  )
}

export function ExtractAnalysis({ analysis, isLoading, error, passageId, constraint, categoryId, initialUserText }: ExtractAnalysisProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [phase, setPhase] = useState<Phase>(initialUserText ? 'write' : 'loading')
  const [activeCategory, setActiveCategory] = useState<CraftCategory | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [extractExpanded, setExtractExpanded] = useState(false)
  const [userText, setUserText] = useState(initialUserText ?? '')
  const [feedback, setFeedback] = useState<UserFeedback | null>(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showFeedbackCard, setShowFeedbackCard] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
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

  useEffect(() => {
    if (phase === 'write' && passageId && constraint) {
      fetchSubmissions()
    }
  }, [phase, passageId, constraint, fetchSubmissions])

  function handleLoadSubmission(s: Submission) {
    setUserText(s.user_text ?? '')
    setFeedback(normalizeFeedback(s.feedback))
    setFeedbackError(null)
  }

  async function handleDeleteSubmission(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/completions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSubmissions((prev) => prev.filter((s) => s.id !== id))
      }
    } finally {
      setDeletingId(null)
    }
  }

  const wordCount = useMemo(() => countWords(userText), [userText])

  const fullText = useMemo(
    () => analysis?.segments.map((s) => s.text).join('') ?? '',
    [analysis]
  )

  async function handleAnalyze() {
    if (!analysis || !userText.trim()) return
    if (userText.trim().length < 50) {
      setFeedbackError('Write at least 50 characters before requesting feedback.')
      return
    }
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const nextPath = pathname ?? '/'
      try {
        sessionStorage.setItem(
          'rewrite-draft',
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
        }),
      })
      if (res.status === 401) {
        const nextPath = pathname ?? '/'
        try {
          sessionStorage.setItem(
            'rewrite-draft',
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
      await saveCompletion(data)
      try {
        sessionStorage.removeItem('rewrite-draft')
      } catch {
        // sessionStorage may be unavailable
      }
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to get feedback')
    } finally {
      setFeedbackLoading(false)
    }
  }

  async function saveCompletion(feedbackData: UserFeedback) {
    if (!passageId || !constraint || !analysis) return
    setSaveError(null)
    try {
      const res = await fetch('/api/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passageId,
          constraint,
          userText: userText.trim(),
          wordCount,
          feedback: feedbackData,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      fetchSubmissions()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
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
        <div className="ea-columns">
          <main className="ea-main">
            <div className="ea-toolbar">
              <CategoryPills active={activeCategory} onToggle={handleCategoryToggle} />
              <ReadItButton
                text={fullText}
                speak={speak}
                stop={stop}
                speaking={speaking}
                loading={speechLoading}
                categoryId={categoryId}
              />
            </div>
            <AnnotatedText
              segments={analysis.segments}
              activeCategory={activeCategory}
              hoveredIndex={hoveredIndex}
              onHover={setHoveredIndex}
            />
            <AnnotationPanel segments={analysis.segments} hoveredIndex={hoveredIndex} />
          </main>
          <SummarySidebar analysis={analysis} onReady={() => setPhase('write')} />
        </div>
      </div>
    )
  }

  return (
    <div className="ea-root">
      <div className="ea-columns">
        <main className="ea-main ea-write-main">
          <div className={`ea-extract-reference${extractExpanded ? ' ea-extract-expanded' : ''}`}>
            <div className="ea-extract-reference-header">
              <h3 className="ea-extract-reference-heading">Original extract</h3>
              <div className="ea-extract-reference-actions">
                <button
                  className="ea-return-to-analysis"
                  onClick={() => setPhase('analyse')}
                >
                  ← Return to analysis
                </button>
                <button
                  className="ea-extract-toggle"
                  onClick={() => setExtractExpanded((v) => !v)}
                >
                  {extractExpanded ? 'Collapse' : 'Expand'}
                </button>
              </div>
            </div>
            <p className="ea-extract-reference-text">{fullText}</p>
            {!extractExpanded && <div className="ea-extract-fade" />}
          </div>
          <textarea
            className="ea-textarea"
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
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
              disabled={testLoading || feedbackLoading}
              title="Generate an example passage for this constraint"
            >
              {testLoading ? 'Generating…' : 'Test'}
            </button>
            <button
              className="ea-analyze-btn"
              onClick={handleAnalyze}
              disabled={feedbackLoading || userText.trim().length < 50}
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
        </main>
        <WriteSidebar
          analysis={analysis}
          submissions={submissions}
          submissionsLoading={submissionsLoading}
          onLoadSubmission={handleLoadSubmission}
          onDeleteSubmission={handleDeleteSubmission}
          deletingId={deletingId}
          formatDate={formatSubmissionDate}
          feedback={feedback}
          feedbackLoading={feedbackLoading}
          feedbackError={feedbackError}
          saveError={saveError}
          originalText={fullText}
          userText={userText}
        />
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
              <span className="sc-brand">REWRITE</span>
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
              <span className="sc-watermark">rewrite — learn to write by imitation</span>
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
            <h2 className="upgrade-prompt-title">Get coached on your writing</h2>
            <p className="upgrade-prompt-text">
              The free tier lets you rewrite and compare. The Core plan adds what makes the difference:
              AI analysis of every rewrite, detailed feedback on your strengths and weaknesses,
              and follow-up chat to go deeper on any passage.
            </p>
            <ul className="upgrade-prompt-features">
              <li>Detailed divergence analysis — where and why your instincts differ</li>
              <li>Strong points and weak points on every submission</li>
              <li>One specific, actionable next step per session</li>
              <li>Follow-up chat to deepen understanding</li>
            </ul>
            <a href="/pricing" className="upgrade-prompt-btn">
              See plans — from $12/month
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
