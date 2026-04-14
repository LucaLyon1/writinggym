'use client'

import { useEffect, useRef } from 'react'
import { RadarChart } from '@/components/RadarChart'
import { CATEGORIES } from '@/lib/categories'

export interface FeedbackScores {
  voice: number | null
  imagery: number | null
  structure: number | null
  pacing: number | null
  constraint?: number | null
}

export interface DivergenceAnalysis {
  voice: string | null
  imagery: string | null
  structure: string | null
  pacing: string | null
}

export interface FeedbackForScoreCard {
  scores: FeedbackScores
  verdict: string
  feedback?: string
  actionable_observation?: string
  divergences?: DivergenceAnalysis
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
  const values = Object.values(scores).filter((v): v is number => v !== null && v !== undefined)
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
            if (value === null || value === undefined) return (
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

        {feedback.actionable_observation && (
          <div className="sc-actionable">
            <span className="sc-actionable-label">Try next time</span>
            <p className="sc-actionable-text">{feedback.actionable_observation}</p>
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
