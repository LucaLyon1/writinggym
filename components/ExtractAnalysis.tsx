'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { CraftCategory, ExtractAnalysis as ExtractAnalysisType, Segment } from '@/types/extract'
import { CATEGORIES } from '@/lib/categories'
import { useSpeech } from '@/hooks/useSpeech'
import { RadarChart } from '@/components/RadarChart'
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

const SCORE_CRITERIA: { key: keyof FeedbackScores; label: string; icon: string }[] = [
  { key: 'voice', label: 'Voice', icon: '🎙' },
  { key: 'imagery', label: 'Imagery', icon: '🎨' },
  { key: 'structure', label: 'Structure', icon: '🏗' },
  { key: 'pacing', label: 'Pacing', icon: '⏱' },
  { key: 'constraint', label: 'Constraint', icon: '🎯' },
]

function getScoreColor(score: number): string {
  if (score >= 80) return '#2d8a4e'
  if (score >= 60) return '#b88a2e'
  if (score >= 40) return '#b86e2e'
  return '#b84a2e'
}

function getOverallGrade(scores: FeedbackScores): { score: number; label: string } {
  const values = Object.values(scores).filter((v): v is number => v !== null)
  const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0
  let label = 'Keep going'
  if (avg >= 90) label = 'Masterful'
  else if (avg >= 80) label = 'Exceptional'
  else if (avg >= 70) label = 'Strong'
  else if (avg >= 60) label = 'Promising'
  else if (avg >= 50) label = 'Developing'
  else if (avg >= 40) label = 'Emerging'
  return { score: avg, label }
}

function ScoreRing({ score, size = 100 }: { score: number; size?: number }) {
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = getScoreColor(score)

  return (
    <svg width={size} height={size} className="sc-ring">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--line)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="sc-ring-progress"
      />
      <text
        x={size / 2}
        y={size / 2 - 4}
        textAnchor="middle"
        dominantBaseline="central"
        className="sc-ring-score"
        style={{ fill: color }}
      >
        {score}
      </text>
      <text
        x={size / 2}
        y={size / 2 + 22}
        textAnchor="middle"
        dominantBaseline="central"
        className="sc-ring-label"
      >
        /100
      </text>
    </svg>
  )
}

function ScoreCardPopup({
  feedback,
  constraint,
  onClose,
}: {
  feedback: UserFeedback
  constraint: string
  onClose: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const overall = getOverallGrade(feedback.scores)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="sc-overlay" onClick={onClose}>
      <div
        className="sc-card"
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="sc-close" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="2" y1="2" x2="12" y2="12" />
            <line x1="12" y1="2" x2="2" y2="12" />
          </svg>
        </button>

        <div className="sc-header">
          <span className="sc-brand">REWRITE</span>
          <span className="sc-divider" />
          <span className="sc-type">Writing Score</span>
        </div>

        <div className="sc-hero">
          <div className="sc-hero-scores">
            <ScoreRing score={overall.score} size={100} />
            <RadarChart
              scores={{
                voice: feedback.scores.voice,
                imagery: feedback.scores.imagery,
                structure: feedback.scores.structure,
                pacing: feedback.scores.pacing,
              }}
              size={140}
              showLabels
            />
          </div>
          <div className="sc-hero-info">
            <span className="sc-grade">{overall.label}</span>
            <p className="sc-verdict">{feedback.verdict}</p>
          </div>
        </div>

        <div className="sc-criteria">
          {SCORE_CRITERIA.map(({ key, label, icon }) => {
            const value = feedback.scores[key]
            if (value === null) return (
              <div key={key} className="sc-criterion sc-criterion-na">
                <div className="sc-criterion-header">
                  <span className="sc-criterion-icon">{icon}</span>
                  <span className="sc-criterion-label">{label}</span>
                  <span className="sc-criterion-value sc-na">N/A</span>
                </div>
                <div className="sc-bar">
                  <div className="sc-bar-fill sc-bar-na" style={{ width: '100%' }} />
                </div>
              </div>
            )
            return (
              <div key={key} className="sc-criterion">
                <div className="sc-criterion-header">
                  <span className="sc-criterion-icon">{icon}</span>
                  <span className="sc-criterion-label">{label}</span>
                  <span
                    className="sc-criterion-value"
                    style={{ color: getScoreColor(value) }}
                  >
                    {value}
                  </span>
                </div>
                <div className="sc-bar">
                  <div
                    className="sc-bar-fill"
                    style={{
                      width: `${value}%`,
                      backgroundColor: getScoreColor(value),
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

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

        {feedback.actionable_observation && (
          <div className="sc-actionable">
            <span className="sc-actionable-label">Try next time</span>
            <p className="sc-actionable-text">{feedback.actionable_observation}</p>
          </div>
        )}

        <div className="sc-constraint">
          <span className="sc-constraint-label">Exercise</span>
          <p className="sc-constraint-text">{constraint}</p>
        </div>

        <div className="sc-footer">
          <span className="sc-watermark">rewrite — learn to write by imitation</span>
        </div>
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
                    const score = feedback.scores[dim]
                    return (
                      <div key={dim} className="ea-divergence-item" style={{ borderLeftColor: config.color }}>
                        <div className="ea-divergence-header">
                          <span className="ea-divergence-label" style={{ color: config.color }}>
                            {config.label}
                          </span>
                          {score !== null && (
                            <span className="ea-divergence-score" style={{ color: getScoreColor(score) }}>
                              {score}/100
                            </span>
                          )}
                        </div>
                        <p className="ea-divergence-text">{text}</p>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {feedback.actionable_observation && (
            <div className="ea-sidebar-section ea-sidebar-actionable">
              <h3 className="ea-sidebar-heading">Try this next time</h3>
              <p className="ea-actionable-text">{feedback.actionable_observation}</p>
            </div>
          )}

          <div className="ea-sidebar-section ea-sidebar-feedback">
            <h3 className="ea-sidebar-heading">Full analysis</h3>
            <div className="ea-sidebar-feedback-content">
              <p className="ea-feedback-text">{feedback.feedback}</p>
            </div>
          </div>

          <div className="ea-sidebar-section">
            <FollowUpChat
              originalText={originalText}
              constraint={analysis.constraint}
              userText={userText}
              feedbackSummary={feedback.feedback}
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

interface FeedbackScores {
  voice: number | null
  imagery: number | null
  structure: number | null
  pacing: number | null
  constraint: number
}

interface DivergenceAnalysis {
  voice: string | null
  imagery: string | null
  structure: string | null
  pacing: string | null
}

interface UserFeedback {
  segments: ExtractAnalysisType['segments']
  summary: string[]
  feedback: string
  scores: FeedbackScores
  divergences?: DivergenceAnalysis
  actionable_observation?: string
  verdict: string
}

interface Submission {
  id: string
  user_text: string | null
  feedback: UserFeedback | null
  word_count: number | null
  completed_at: string
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
  const [showScoreCard, setShowScoreCard] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
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

  useEffect(() => {
    if (phase === 'write' && passageId && constraint) {
      fetchSubmissions()
    }
  }, [phase, passageId, constraint, fetchSubmissions])

  function handleLoadSubmission(s: Submission) {
    setUserText(s.user_text ?? '')
    setFeedback(s.feedback as UserFeedback | null)
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
      if (data.scores) setShowScoreCard(true)
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
              title="Generate a passage that should score 100/100 for this constraint"
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
            {feedback?.scores && (
              <button
                className="ea-scorecard-btn"
                onClick={() => setShowScoreCard(true)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M8 12h8M8 8h8M8 16h4" />
                </svg>
                Score Card
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
      {showScoreCard && feedback?.scores && analysis && (
        <ScoreCardPopup
          feedback={feedback}
          constraint={analysis.constraint}
          onClose={() => setShowScoreCard(false)}
        />
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
              AI analysis of every rewrite, craft scores across four dimensions, a personal practice record,
              and follow-up chat to go deeper on any passage.
            </p>
            <ul className="upgrade-prompt-features">
              <li>Detailed divergence analysis — where and why your instincts differ</li>
              <li>Craft scores that track your progress over time</li>
              <li>One specific, actionable observation per session</li>
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
