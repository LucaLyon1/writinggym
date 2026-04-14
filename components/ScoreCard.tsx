'use client'

import { useEffect, useRef } from 'react'
import { CATEGORIES } from '@/lib/categories'

export interface DivergenceAnalysis {
  voice: string | null
  imagery: string | null
  structure: string | null
  pacing: string | null
}

export interface FeedbackForScoreCard {
  strong_points: string[]
  weak_points: string[]
  analysis: string
  verdict: string
  next_step?: string
  divergences?: DivergenceAnalysis
}

export function ScoreCard({
  feedback,
  constraint,
  onClose,
}: {
  feedback: FeedbackForScoreCard
  constraint?: string | null
  onClose: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)

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
                const config = CATEGORIES[dim as keyof typeof CATEGORIES]
                if (!config) return null
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

        {constraint && (
          <div className="sc-constraint">
            <span className="sc-constraint-label">Exercise</span>
            <p className="sc-constraint-text">{constraint}</p>
          </div>
        )}

        <div className="sc-footer">
          <span className="sc-watermark">rewrite — learn to write by imitation</span>
        </div>
      </div>
    </div>
  )
}
