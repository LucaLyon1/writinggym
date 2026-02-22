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
              borderColor: isActive ? config.border : 'rgba(232,228,220,0.2)',
              color: isActive ? config.color : '#9B9488',
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
}: {
  text: string
  speak: (t: string) => void
  stop: () => void
  speaking: boolean
  loading: boolean
}) {
  const busy = speaking || loading

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
    <button className="ea-read-btn" onClick={() => speak(text)}>
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

export function ExtractAnalysis({ analysis, isLoading, error }: ExtractAnalysisProps) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [activeCategory, setActiveCategory] = useState<CraftCategory | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [userText, setUserText] = useState('')
  const { speak, stop, speaking, loading: speechLoading } = useSpeech()

  const wordCount = useMemo(() => countWords(userText), [userText])

  const fullText = useMemo(
    () => analysis?.segments.map((s) => s.text).join('') ?? '',
    [analysis]
  )

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
      <div className="ea-source">{analysis.source}</div>
      <div className="ea-columns">
        <main className="ea-main ea-write-main">
          <textarea
            className="ea-textarea"
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            placeholder="Begin here…"
          />
          <div className="ea-write-footer">
            <span className="ea-word-count">{wordCount} words</span>
            <button
              className="ea-back-link"
              onClick={() => setPhase('analyse')}
            >
              ← back to extract
            </button>
          </div>
        </main>
        <WriteSidebar analysis={analysis} />
      </div>
    </div>
  )
}
