'use client'

import { useState, useMemo, useEffect } from 'react'
import type { CraftCategory, ExtractAnalysis as ExtractAnalysisType, Segment } from '@/types/extract'
import { CATEGORIES } from '@/lib/categories'
import { useSpeech } from '@/hooks/useSpeech'

interface ExtractAnalysisProps {
  analysis: ExtractAnalysisType | null
  isLoading: boolean
  error: string | null
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
}: {
  text: string
  speak: (t: string) => void
  stop: () => void
  speaking: boolean
  loading: boolean
  disabled?: boolean
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
      onClick={() => speak(text)}
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

function WriteSidebar({ analysis }: { analysis: ExtractAnalysisType }) {
  const annotatedSegments = analysis.segments.filter((s) => s.annotation)

  return (
    <aside className="ea-sidebar">
      <div className="ea-sidebar-section">
        <h3 className="ea-sidebar-heading">Your exercise</h3>
        <p className="ea-constraint-reminder">{analysis.constraint}</p>
      </div>

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
    </aside>
  )
}

interface UserFeedback {
  segments: ExtractAnalysisType['segments']
  summary: string[]
  feedback: string
}

export function ExtractAnalysis({ analysis, isLoading, error }: ExtractAnalysisProps) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [activeCategory, setActiveCategory] = useState<CraftCategory | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [userText, setUserText] = useState('')
  const [feedback, setFeedback] = useState<UserFeedback | null>(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const { speak, stop, speaking, loading: speechLoading } = useSpeech()

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
        }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to get feedback')
      }
      const data = (await res.json()) as UserFeedback
      setFeedback(data)
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to get feedback')
    } finally {
      setFeedbackLoading(false)
    }
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
        <div className="ea-source">{analysis.source}</div>
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
      <div className="ea-source ea-source-with-back">
        <button
          className="ea-back-link"
          onClick={() => setPhase('analyse')}
        >
          ← back to extract
        </button>
        <span>{analysis.source}</span>
      </div>
      <div className="ea-columns">
        <main className="ea-main ea-write-main">
          <div className="ea-extract-reference">
            <h3 className="ea-extract-reference-heading">Original extract</h3>
            <p className="ea-extract-reference-text">{fullText}</p>
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
            />
            <button
              className="ea-analyze-btn"
              onClick={handleAnalyze}
              disabled={feedbackLoading || userText.trim().length < 50}
            >
              {feedbackLoading ? 'Analysing…' : 'Analyse my writing'}
            </button>
          </div>

          {feedbackLoading && (
            <p className="ea-feedback-loading">Analysing your writing…</p>
          )}

          {feedbackError && (
            <p className="ea-feedback-error">{feedbackError}</p>
          )}

          {feedback && !feedbackLoading && (
            <div className="ea-feedback-block">
              <h3 className="ea-feedback-heading">Honest feedback</h3>
              <div className="ea-feedback-content">
                <p className="ea-feedback-text">{feedback.feedback}</p>
              </div>
            </div>
          )}
        </main>
        <WriteSidebar analysis={analysis} />
      </div>
    </div>
  )
}
