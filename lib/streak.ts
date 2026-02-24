/**
 * Computes current and longest streaks from passage completions.
 * A day counts toward a streak if the user completed at least one passage that day.
 * Current streak: consecutive days ending on the most recent activity date.
 * If the most recent activity was today or yesterday, the streak is still "alive".
 * If it was 2+ days ago, the streak is broken (0).
 */

function toDateKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function computeStreaksFromCompletions(
  completions: { completed_at: string }[]
): { currentStreak: number; longestStreak: number } {
  const activeDates = new Set<string>()
  for (const c of completions) {
    if (c.completed_at) {
      activeDates.add(toDateKey(c.completed_at))
    }
  }

  const sortedDates = Array.from(activeDates).sort()

  if (sortedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 }
  }

  const today = toDateKey(new Date().toISOString())
  const yesterday = addDays(today, -1)
  const mostRecent = sortedDates[sortedDates.length - 1]

  // Current streak: only counts if most recent activity was today or yesterday
  let currentStreak = 0
  if (mostRecent === today || mostRecent === yesterday) {
    let d = mostRecent
    while (activeDates.has(d)) {
      currentStreak++
      d = addDays(d, -1)
    }
  }

  // Longest streak: find longest consecutive run in the entire history
  let longestStreak = 1
  let run = 1
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = sortedDates[i - 1]
    const curr = sortedDates[i]
    const expectedNext = addDays(prev, 1)
    if (curr === expectedNext) {
      run++
      longestStreak = Math.max(longestStreak, run)
    } else {
      run = 1
    }
  }

  return { currentStreak, longestStreak }
}
