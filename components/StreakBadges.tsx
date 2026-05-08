'use client'

import { useState, useTransition } from 'react'
import {
  STREAK_BADGES,
  getCurrentBadge,
  getNextBadge,
  daysUntilNextBadge,
} from '@/lib/streak-badges'
import { updateSelectedBadge } from '@/app/actions/profile'

type Props = {
  currentStreak: number
  selectedBadge: string | null
}

export function StreakBadges({ currentStreak, selectedBadge: initialSelected }: Props) {
  const currentBadge = getCurrentBadge(currentStreak)
  const nextBadge = getNextBadge(currentStreak)
  const daysUntilNext = daysUntilNextBadge(currentStreak)
  const [selected, setSelected] = useState<string | null>(initialSelected)
  const [isPending, startTransition] = useTransition()

  function handleSelect(label: string) {
    const next = selected === label ? null : label
    setSelected(next)
    startTransition(async () => {
      await updateSelectedBadge(next)
    })
  }

  const featured = STREAK_BADGES.find((b) => b.label === selected)

  return (
    <div className="streak-badges">
      <div className="streak-badges-header">
        <div className="streak-badges-current">
          <span className="streak-badges-emoji" aria-hidden>
            {featured?.emoji ?? currentBadge?.emoji ?? '—'}
          </span>
          <div className="streak-badges-info">
            <span className="streak-badges-label">
              {featured
                ? `${featured.label} (featured)`
                : currentBadge
                  ? currentBadge.label
                  : 'No badge yet'}
            </span>
            {nextBadge && daysUntilNext != null && (
              <span className="streak-badges-next">
                Next: {nextBadge.emoji} {nextBadge.label} in {daysUntilNext} day{daysUntilNext !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <p className="streak-badges-hint">Click an unlocked badge to feature it on your profile</p>
      </div>

      <ul className="streak-badges-grid">
        {STREAK_BADGES.map((badge) => {
          const unlocked = currentStreak >= badge.days
          const isSelected = selected === badge.label
          const daysToUnlock = badge.days - currentStreak

          return (
            <li key={badge.days}>
              <button
                type="button"
                disabled={!unlocked || isPending}
                onClick={() => unlocked && handleSelect(badge.label)}
                className={`streak-badge-tile ${unlocked ? 'unlocked' : 'locked'} ${isSelected ? 'selected' : ''}`}
                title={
                  unlocked
                    ? isSelected
                      ? `Unfeature ${badge.label}`
                      : `Feature ${badge.label}`
                    : `Unlock in ${daysToUnlock} more day${daysToUnlock !== 1 ? 's' : ''}`
                }
              >
                <span className="streak-badge-tile-emoji">{badge.emoji}</span>
                <span className="streak-badge-tile-label">{badge.label}</span>
                <span className="streak-badge-tile-days">{badge.days}d</span>
                {!unlocked && (
                  <span className="streak-badge-tile-lock" aria-hidden>
                    🔒
                  </span>
                )}
                {isSelected && (
                  <span className="streak-badge-tile-check" aria-label="Featured">
                    ✓
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
