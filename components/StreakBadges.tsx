'use client'

import {
  STREAK_BADGES,
  getCurrentBadge,
  getNextBadge,
  daysUntilNextBadge,
} from '@/lib/streak-badges'
import { StreakBadgeIcon } from '@/components/StreakBadgeIcon'
import { useShowStreakBadge } from '@/components/profile/streak-badge-pref'

type Props = {
  currentStreak: number
}

export function StreakBadges({ currentStreak }: Props) {
  const currentBadge = getCurrentBadge(currentStreak)
  const nextBadge = getNextBadge(currentStreak)
  const daysUntilNext = daysUntilNextBadge(currentStreak)
  const [showByName, setShowByName] = useShowStreakBadge()

  const progress = nextBadge ? Math.min(1, currentStreak / nextBadge.days) : 1

  return (
    <section className="streak-badges" aria-label="Streak badges">
      <div className="streak-badges-current">
        {currentBadge ? (
          <StreakBadgeIcon badge={currentBadge} size={44} />
        ) : (
          <StreakBadgeIcon badge={STREAK_BADGES[0]} size={44} locked />
        )}
        <div className="streak-badges-info">
          <span className="streak-badges-label">{currentBadge?.label ?? 'No badge yet'}</span>
          <span className="streak-badges-sublabel">
            {currentStreak} day streak
          </span>
        </div>
      </div>

      {nextBadge && daysUntilNext != null ? (
        <div className="streak-badges-progress">
          <div className="streak-badges-progress-head">
            <span>Next: {nextBadge.label} in {daysUntilNext} day{daysUntilNext !== 1 ? 's' : ''}</span>
            <span>{currentStreak} / {nextBadge.days} days</span>
          </div>
          <div
            className="streak-badges-bar"
            role="progressbar"
            aria-label={`Progress to ${nextBadge.label}`}
            aria-valuemin={0}
            aria-valuemax={nextBadge.days}
            aria-valuenow={currentStreak}
          >
            <span style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      ) : (
        <p className="streak-badges-progress-head">Every badge earned.</p>
      )}

      <ol className="streak-badges-ladder" aria-label="All streak badges">
        {STREAK_BADGES.map((badge) => {
          const earned = currentStreak >= badge.days
          const isNext = badge === nextBadge
          return (
            <li
              key={badge.label}
              className={`streak-badges-step${earned ? ' is-earned' : ''}${isNext ? ' is-next' : ''}`}
              title={`${badge.label}: ${badge.days}-day streak${earned ? ' (earned)' : ''}`}
            >
              <StreakBadgeIcon badge={badge} size={28} locked={!earned} />
              <span className="streak-badges-step-days">{badge.days}d</span>
            </li>
          )
        })}
      </ol>

      <label className="streak-badges-toggle">
        <span>Show badge by my name</span>
        <input
          type="checkbox"
          role="switch"
          checked={showByName}
          onChange={(e) => setShowByName(e.target.checked)}
        />
        <span className="streak-badges-switch" aria-hidden="true" />
      </label>
    </section>
  )
}
