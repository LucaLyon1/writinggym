'use client'

import { useEffect, useState } from 'react'
import { CATEGORIES } from '@/lib/categories'

interface ScoreSnapshot {
  date: string
  passage_id: string
  passage_title: string
  author: string
  voice: number | null
  imagery: number | null
  structure: number | null
  pacing: number | null
  constraint: number | null
}

interface ScoreData {
  history: ScoreSnapshot[]
  averages: {
    voice: number | null
    imagery: number | null
    structure: number | null
    pacing: number | null
    constraint: number | null
    overall: number | null
    session_count: number
  }
  authors: string[]
  dimensions_practiced: Record<string, number>
}

const DIMS = ['voice', 'imagery', 'structure', 'pacing'] as const

function getScoreColor(score: number): string {
  if (score >= 80) return '#2d8a4e'
  if (score >= 60) return '#b88a2e'
  if (score >= 40) return '#b86e2e'
  return '#b84a2e'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function PracticeRecord() {
  const [data, setData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetch('/api/scores')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="pr-loading">Loading practice record…</div>
  }

  if (!data || data.history.length === 0) {
    return null
  }

  const { history, authors, dimensions_practiced } = data
  const sortedHistory = [...history].reverse()
  const visibleHistory = showAll ? sortedHistory : sortedHistory.slice(0, 10)

  return (
    <section className="pr-root" aria-label="Practice record">
      <h2 className="pr-title">Practice Record</h2>

      <div className="pr-stats-row">
        <div className="pr-stat-card">
          <span className="pr-stat-value">{authors.length}</span>
          <span className="pr-stat-label">
            Author{authors.length !== 1 ? 's' : ''} encountered
          </span>
          <div className="pr-author-list">
            {authors.slice(0, 8).map((a) => (
              <span key={a} className="pr-author-tag">{a}</span>
            ))}
            {authors.length > 8 && (
              <span className="pr-author-tag pr-author-more">+{authors.length - 8} more</span>
            )}
          </div>
        </div>

        <div className="pr-stat-card">
          <span className="pr-stat-value">
            {Object.values(dimensions_practiced).reduce((a, b) => a + b, 0)}
          </span>
          <span className="pr-stat-label">Dimensions practiced</span>
          <div className="pr-dim-list">
            {DIMS.map((dim) => {
              const count = dimensions_practiced[dim] ?? 0
              if (count === 0) return null
              const config = CATEGORIES[dim]
              return (
                <span key={dim} className="pr-dim-tag" style={{ color: config.color }}>
                  {config.label}: {count}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      <div className="pr-log">
        <h3 className="pr-log-title">Session log</h3>
        <div className="pr-log-list">
          {visibleHistory.map((snap, i) => {
            const avg = DIMS
              .map((d) => snap[d])
              .filter((v): v is number => v !== null)
            const overall = avg.length > 0
              ? Math.round(avg.reduce((a, b) => a + b, 0) / avg.length)
              : null
            return (
              <div key={`${snap.passage_id}-${snap.date}-${i}`} className="pr-log-item">
                <span className="pr-log-date">{formatDate(snap.date)}</span>
                <div className="pr-log-passage">
                  <span className="pr-log-passage-title">{snap.passage_title}</span>
                  <span className="pr-log-passage-author">{snap.author}</span>
                </div>
                <div className="pr-log-scores">
                  {DIMS.map((dim) => {
                    const val = snap[dim]
                    if (val === null) return null
                    const config = CATEGORIES[dim]
                    return (
                      <span
                        key={dim}
                        className="pr-log-score"
                        style={{ color: getScoreColor(val) }}
                        title={config.label}
                      >
                        {config.label.charAt(0)}: {val}
                      </span>
                    )
                  })}
                </div>
                {overall !== null && (
                  <span
                    className="pr-log-overall"
                    style={{ color: getScoreColor(overall) }}
                  >
                    {overall}
                  </span>
                )}
              </div>
            )
          })}
        </div>
        {sortedHistory.length > 10 && (
          <button
            className="pr-log-toggle"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? 'Show less' : `Show all ${sortedHistory.length} sessions`}
          </button>
        )}
      </div>
    </section>
  )
}
