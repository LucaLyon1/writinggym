'use client'

import { useEffect, useState } from 'react'
import { RadarChart } from './RadarChart'
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

interface ScoreAverages {
  voice: number | null
  imagery: number | null
  structure: number | null
  pacing: number | null
  constraint: number | null
  overall: number | null
  session_count: number
}

interface ScoreData {
  history: ScoreSnapshot[]
  averages: ScoreAverages
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

function ScoreTrendLine({ history, dimension }: { history: ScoreSnapshot[]; dimension: typeof DIMS[number] }) {
  const config = CATEGORIES[dimension]
  const dataPoints = history
    .filter((s) => s[dimension] !== null)
    .map((s) => ({ date: s.date, value: s[dimension] as number }))

  if (dataPoints.length < 2) return null

  const width = 280
  const height = 60
  const padding = { top: 8, right: 8, bottom: 4, left: 8 }
  const plotW = width - padding.left - padding.right
  const plotH = height - padding.top - padding.bottom

  const points = dataPoints.map((d, i) => {
    const x = padding.left + (i / (dataPoints.length - 1)) * plotW
    const y = padding.top + plotH - (d.value / 100) * plotH
    return { x, y, value: d.value }
  })

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  const first = dataPoints[0].value
  const last = dataPoints[dataPoints.length - 1].value
  const trend = last - first

  return (
    <div className="sp-trend-row">
      <div className="sp-trend-meta">
        <span className="sp-trend-dim" style={{ color: config.color }}>{config.label}</span>
        <span className="sp-trend-change" style={{ color: trend >= 0 ? '#2d8a4e' : '#b84a2e' }}>
          {trend >= 0 ? '+' : ''}{trend} pts
        </span>
      </div>
      <svg width={width} height={height} className="sp-trend-svg">
        <path d={pathD} fill="none" stroke={config.color} strokeWidth={1.5} opacity={0.7} />
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r={3}
            fill={config.color}
          />
        )}
      </svg>
    </div>
  )
}

export function ScoreProfile() {
  const [data, setData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/scores')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="sp-loading">Loading score data…</div>
  }

  if (!data || data.averages.session_count === 0) {
    return (
      <div className="sp-empty">
        <p>Complete a few sessions with feedback to see your craft profile.</p>
      </div>
    )
  }

  const { averages, history } = data

  return (
    <section className="sp-root" aria-label="Craft score profile">
      <h2 className="sp-title">Craft Profile</h2>
      <p className="sp-subtitle">
        Based on {averages.session_count} scored session{averages.session_count !== 1 ? 's' : ''}
      </p>

      <div className="sp-grid">
        <div className="sp-radar-section">
          <RadarChart
            scores={{
              voice: averages.voice,
              imagery: averages.imagery,
              structure: averages.structure,
              pacing: averages.pacing,
            }}
            size={220}
            showLabels
          />
          {averages.overall !== null && (
            <div className="sp-overall">
              <span className="sp-overall-score" style={{ color: getScoreColor(averages.overall) }}>
                {averages.overall}
              </span>
              <span className="sp-overall-label">average</span>
            </div>
          )}
        </div>

        <div className="sp-details-section">
          <div className="sp-dimensions">
            {DIMS.map((dim) => {
              const value = averages[dim]
              const practiced = data.dimensions_practiced[dim] ?? 0
              const config = CATEGORIES[dim]
              return (
                <div key={dim} className="sp-dim-row">
                  <span className="sp-dim-label" style={{ color: config.color }}>
                    {config.label}
                  </span>
                  <div className="sp-dim-bar-wrap">
                    <div className="sp-dim-bar">
                      <div
                        className="sp-dim-bar-fill"
                        style={{
                          width: value !== null ? `${value}%` : '0%',
                          backgroundColor: value !== null ? config.color : 'var(--line)',
                        }}
                      />
                    </div>
                    <span className="sp-dim-value">
                      {value !== null ? value : '—'}
                    </span>
                  </div>
                  <span className="sp-dim-count">{practiced} session{practiced !== 1 ? 's' : ''}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {history.length >= 3 && (
        <div className="sp-trends">
          <h3 className="sp-trends-title">Score trends</h3>
          {DIMS.map((dim) => (
            <ScoreTrendLine key={dim} history={history} dimension={dim} />
          ))}
        </div>
      )}
    </section>
  )
}
