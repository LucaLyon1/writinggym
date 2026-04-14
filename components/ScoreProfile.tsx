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

export function ScoreProfile() {
  const [data, setData] = useState<PracticeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/scores')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="sp-loading">Loading practice data…</div>
  }

  if (!data || data.session_count === 0) {
    return (
      <div className="sp-empty">
        <p>Complete a few sessions to see your practice profile.</p>
      </div>
    )
  }

  return (
    <section className="sp-root" aria-label="Practice profile">
      <h2 className="sp-title">Practice Profile</h2>
      <p className="sp-subtitle">
        {data.session_count} session{data.session_count !== 1 ? 's' : ''} completed
        {data.sessions_with_feedback > 0 && (
          <> · {data.sessions_with_feedback} with feedback</>
        )}
      </p>

      <div className="sp-grid">
        <div className="sp-stat-card">
          <span className="sp-stat-value">{data.authors.length}</span>
          <span className="sp-stat-label">
            Author{data.authors.length !== 1 ? 's' : ''} studied
          </span>
          <div className="sp-author-list">
            {data.authors.slice(0, 8).map((a) => (
              <span key={a} className="sp-author-tag">{a}</span>
            ))}
            {data.authors.length > 8 && (
              <span className="sp-author-tag sp-author-more">+{data.authors.length - 8} more</span>
            )}
          </div>
        </div>

        <div className="sp-stat-card">
          <span className="sp-stat-value">{data.session_count}</span>
          <span className="sp-stat-label">Total sessions</span>
        </div>
      </div>
    </section>
  )
}
