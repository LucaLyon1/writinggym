'use client'

import { useEffect, useState } from 'react'

interface SessionSnapshot {
  date: string
  passage_id: string
  passage_title: string
  author: string
  verdict: string | null
  had_feedback: boolean
}

interface PracticeData {
  history: SessionSnapshot[]
  session_count: number
  sessions_with_feedback: number
  authors: string[]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function PracticeRecord() {
  const [data, setData] = useState<PracticeData | null>(null)
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

  const { history, authors } = data
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
          <span className="pr-stat-value">{data.session_count}</span>
          <span className="pr-stat-label">Total sessions</span>
        </div>
      </div>

      <div className="pr-log">
        <h3 className="pr-log-title">Session log</h3>
        <div className="pr-log-list">
          {visibleHistory.map((snap, i) => (
            <div key={`${snap.passage_id}-${snap.date}-${i}`} className="pr-log-item">
              <span className="pr-log-date">{formatDate(snap.date)}</span>
              <div className="pr-log-passage">
                <span className="pr-log-passage-title">{snap.passage_title}</span>
                <span className="pr-log-passage-author">{snap.author}</span>
              </div>
              {snap.verdict && (
                <span className="pr-log-verdict">{snap.verdict}</span>
              )}
              {snap.had_feedback && !snap.verdict && (
                <span className="pr-log-feedback-badge">Feedback received</span>
              )}
            </div>
          ))}
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
