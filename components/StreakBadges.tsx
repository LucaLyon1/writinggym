'use client'

import {
  getCurrentBadge,
  getNextBadge,
  daysUntilNextBadge,
} from '@/lib/streak-badges'

type Props = {
  currentStreak: number
}

export function StreakBadges({ currentStreak }: Props) {
  const currentBadge = getCurrentBadge(currentStreak)
  const nextBadge = getNextBadge(currentStreak)
  const daysUntilNext = daysUntilNextBadge(currentStreak)

  if (!currentBadge && !nextBadge) return null

  return (
    <div className="streak-badges">
      {currentBadge && (
        <div className="streak-badges-current">
          <span className="streak-badges-emoji" aria-hidden>
            {currentBadge.emoji}
          </span>
          <div className="streak-badges-info">
            <span className="streak-badges-label">{currentBadge.label}</span>
            <span className="streak-badges-sublabel">{currentStreak} day streak</span>
          </div>
        </div>
      )}
      {nextBadge && daysUntilNext != null && (
        <div className="streak-badges-next-row">
          <span className="streak-badges-next-emoji" aria-hidden>
            {nextBadge.emoji}
          </span>
          <span className="streak-badges-next">
            {nextBadge.label} in {daysUntilNext} day{daysUntilNext !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  )
}
