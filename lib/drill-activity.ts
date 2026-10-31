/**
 * Drill activity on the profile: which days had drills, and the streak over
 * writing and drills together.
 *
 * Days are calendar days in the writer's own time zone ("YYYY-MM-DD"), the
 * same day the daily puzzle and the profile heatmap already use. Drill
 * progress lives in the browser for now, so this only sees drills played on
 * this device until drill completions are stored server-side.
 */
import { dayKey, previousDay } from './drills-daily'
import type { DailyRecord } from './drills-daily'

/** Drills finished per local day. */
export type DrillDays = Record<string, number>

const DAY = /^\d{4}-\d{2}-\d{2}$/

/** Reads stored drill days, dropping anything malformed. Older saves have none. */
export function parseDrillDays(raw: unknown): DrillDays {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const days: DrillDays = {}
  for (const [day, count] of Object.entries(raw as Record<string, unknown>)) {
    const n = Math.floor(Number(count))
    if (DAY.test(day) && n > 0) days[day] = n
  }
  return days
}

/** Counts one finished drill on `day`. */
export function recordDrillDay(days: DrillDays, day: string): DrillDays {
  return { ...days, [day]: (days[day] ?? 0) + 1 }
}

/**
 * Every day with drill activity we know of. Recorded days keep their count;
 * saves from before days were recorded still know the daily puzzle's run
 * (the `streak` days ending on `daily.day`), so those days count once each.
 */
export function drillActivityDays(progress: { days?: DrillDays; daily: DailyRecord }): DrillDays {
  const days: DrillDays = { ...(progress.days ?? {}) }
  const { day, streak } = progress.daily
  if (DAY.test(day)) {
    let d = day
    for (let i = 0; i < Math.max(1, streak); i++) {
      if (!days[d]) days[d] = 1
      d = previousDay(d)
    }
  }
  return days
}

/** The local day of a timestamp, as the heatmap shows it. */
export function localDayOf(timestamp: string): string | null {
  const d = new Date(timestamp)
  return Number.isNaN(d.getTime()) ? null : dayKey(d)
}

/**
 * The current and longest run of consecutive active days. The current run is
 * still alive when the last active day is today or yesterday, as with the
 * daily puzzle.
 */
export function streakStats(activeDays: Iterable<string>, today: string): { current: number; longest: number } {
  const set = new Set([...activeDays].filter((d) => DAY.test(d)))
  let longest = 0
  for (const day of set) {
    if (set.has(previousDay(day))) continue // not the start of a run
    let length = 1
    let next = nextDay(day)
    while (set.has(next)) {
      length++
      next = nextDay(next)
    }
    longest = Math.max(longest, length)
  }
  let current = 0
  let d = set.has(today) ? today : previousDay(today)
  while (set.has(d)) {
    current++
    d = previousDay(d)
  }
  return { current, longest }
}

function nextDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  return dayKey(new Date(y, m - 1, d + 1))
}

/**
 * The streak shown on the profile once drills are known. The server streak
 * (writing only, counted on UTC days) is never lowered: drills can only add
 * days, so we take the larger of it and the streak over writing and drill
 * days together on local days.
 */
export function mergedStreak(
  server: { current: number; longest: number },
  completions: { completed_at: string | null }[],
  drillDays: DrillDays,
  today: string,
): { current: number; longest: number } {
  if (Object.keys(drillDays).length === 0) return server
  const days = new Set(Object.keys(drillDays))
  for (const c of completions) {
    const day = c.completed_at ? localDayOf(c.completed_at) : null
    if (day) days.add(day)
  }
  const local = streakStats(days, today)
  const current = Math.max(server.current, local.current)
  return { current, longest: Math.max(server.longest, local.longest, current) }
}
