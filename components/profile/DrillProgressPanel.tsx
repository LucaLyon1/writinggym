'use client'

import { useMemo, useSyncExternalStore } from 'react'
import Link from 'next/link'
import {
  FAMILY_LABELS,
  FAMILY_ORDER,
  LEVEL_NAMES,
  MAX_STARS,
  drillStats,
  starsFor,
  suggestedTechnique,
  type ProgressTally,
} from '@/lib/drills'
import { parseProgress, progressSnapshot, subscribeProgress } from '@/components/drills/progress'

function Bar({ label, tally }: { label: string; tally: ProgressTally }) {
  const pct = tally.maxStars ? Math.round((tally.stars / tally.maxStars) * 100) : 0
  return (
    <div className="drp-bar-row">
      <div className="drp-bar-head">
        <span className="drp-bar-label">{label}</span>
        <span className="drp-bar-count">
          {tally.mastered}/{tally.scales} mastered · ★ {tally.stars}/{tally.maxStars}
        </span>
      </div>
      <div
        className="profile-quota-bar drp-bar"
        role="progressbar"
        aria-label={label}
        aria-valuenow={tally.stars}
        aria-valuemin={0}
        aria-valuemax={tally.maxStars}
      >
        <div className="profile-quota-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/** Drill progress for the profile. It lives in this browser until drills are stored server-side. */
export function DrillProgressPanel() {
  // The server has no progress to show (undefined); the browser reads it on hydration.
  const raw = useSyncExternalStore(subscribeProgress, progressSnapshot, () => undefined)
  const progress = useMemo(() => (raw === undefined ? null : parseProgress(raw)), [raw])

  if (!progress) return <p className="drp-loading">Loading your drills…</p>

  const stats = drillStats(progress.solved)
  if (stats.puzzlesSolved === 0 && progress.bestStreak === 0) {
    return (
      <div className="profile-empty">
        <p>You haven&apos;t solved a drill yet.</p>
        <Link href="/" className="profile-empty-link">
          Start your first drill
        </Link>
      </div>
    )
  }

  const next = suggestedTechnique(progress.solved)
  const nextStars = starsFor(progress.solved, next.id)
  const allDone = stats.mastered === stats.scales

  return (
    <div className="drp">
      <div className="drp-tiles">
        <div className="drp-tile">
          <span className="drp-tile-value">🔥 {progress.streak}</span>
          <span className="drp-tile-label">Current streak</span>
        </div>
        <div className="drp-tile">
          <span className="drp-tile-value">{progress.bestStreak}</span>
          <span className="drp-tile-label">Best streak</span>
        </div>
        <div className="drp-tile">
          <span className="drp-tile-value">{stats.puzzlesSolved}</span>
          <span className="drp-tile-label">Puzzles solved</span>
        </div>
        <div className="drp-tile">
          <span className="drp-tile-value">
            {stats.mastered}/{stats.scales}
          </span>
          <span className="drp-tile-label">Scales mastered</span>
        </div>
      </div>

      <Link href="/" className="drp-next">
        <span className="drp-next-kicker">{allDone ? 'Every scale mastered' : 'Up next'}</span>
        <span className="drp-next-name">{allDone ? 'Keep your hand in' : next.name}</span>
        {!allDone && (
          <span className="drp-next-meta">
            {FAMILY_LABELS[next.family]} · {'★'.repeat(nextStars)}
            <span className="drp-star-off">{'★'.repeat(MAX_STARS - nextStars)}</span>
          </span>
        )}
        <span className="drp-next-cta">Play →</span>
      </Link>

      <section className="drp-section">
        <h3 className="profile-quotas-title">Overall</h3>
        <Bar label="All scales" tally={stats} />
      </section>

      <section className="drp-section">
        <h3 className="profile-quotas-title">By level</h3>
        {([1, 2, 3] as const).map((level) => (
          <Bar key={level} label={`Level ${level} · ${LEVEL_NAMES[level]}`} tally={stats.byLevel[level]} />
        ))}
      </section>

      <section className="drp-section">
        <h3 className="profile-quotas-title">By skill</h3>
        {FAMILY_ORDER.map((f) => (
          <Bar key={f} label={FAMILY_LABELS[f]} tally={stats.byFamily[f]} />
        ))}
      </section>

      <p className="drp-note">Drill progress is saved in this browser for now.</p>
    </div>
  )
}
