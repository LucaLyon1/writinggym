/**
 * Streak badge milestones. Each badge unlocks at the given day count.
 * Emojis progress from small/growing to impressive/legendary.
 */

export const STREAK_BADGES = [
  { days: 1, emoji: '🌱', label: 'Sprout' },
  { days: 3, emoji: '🌿', label: 'Herb' },
  { days: 7, emoji: '🌳', label: 'Oak' },
  { days: 14, emoji: '🏔️', label: 'Summit' },
  { days: 30, emoji: '🏆', label: 'Champion' },
  { days: 60, emoji: '🔥', label: 'On Fire' },
  { days: 100, emoji: '💎', label: 'Diamond' },
  { days: 365, emoji: '👑', label: 'Legend' },
] as const

export type StreakBadge = (typeof STREAK_BADGES)[number]

/** Returns the highest badge the user has earned for their current streak */
export function getCurrentBadge(streak: number): StreakBadge | null {
  let earned: StreakBadge | null = null
  for (const badge of STREAK_BADGES) {
    if (streak >= badge.days) {
      earned = badge
    }
  }
  return earned
}

/** Returns the next badge to unlock, or null if all are earned */
export function getNextBadge(streak: number): StreakBadge | null {
  for (const badge of STREAK_BADGES) {
    if (streak < badge.days) return badge
  }
  return null
}

/** Days remaining until the next badge */
export function daysUntilNextBadge(streak: number): number | null {
  const next = getNextBadge(streak)
  if (!next) return null
  return next.days - streak
}
