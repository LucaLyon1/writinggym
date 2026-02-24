import {
  STREAK_BADGES,
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

  return (
    <div className="streak-badges">
      <div className="streak-badges-current">
        <span className="streak-badges-emoji" aria-hidden>
          {currentBadge?.emoji ?? '—'}
        </span>
        <div className="streak-badges-info">
          <span className="streak-badges-label">
            {currentBadge ? currentBadge.label : 'No badge yet'}
          </span>
          {nextBadge && daysUntilNext != null && (
            <span className="streak-badges-next">
              Next: {nextBadge.emoji} in {daysUntilNext} day{daysUntilNext !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <details className="streak-badges-ladder">
        <summary className="streak-badges-summary">
          View all badges
        </summary>
        <ul className="streak-badges-list">
          {STREAK_BADGES.map((badge) => {
            const unlocked = currentStreak >= badge.days
            const daysToUnlock = badge.days - currentStreak
            return (
              <li
                key={badge.days}
                className={`streak-badges-item ${unlocked ? 'unlocked' : 'locked'}`}
              >
                <span className="streak-badges-item-emoji">{badge.emoji}</span>
                <span className="streak-badges-item-days">{badge.days} day{badge.days !== 1 ? 's' : ''}</span>
                <span className="streak-badges-item-label">{badge.label}</span>
                {!unlocked && (
                  <span className="streak-badges-item-hint">
                    in {daysToUnlock} day{daysToUnlock !== 1 ? 's' : ''}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </details>
    </div>
  )
}
