/**
 * The daily puzzle: one drill per calendar day, the same for every writer.
 *
 * Every scale in every key (each subject, or each lesson) goes into a pool,
 * shuffled once with a fixed seed, and the days walk through it in order. So
 * the pick looks random, nothing repeats until the whole pool has been played,
 * and no two days in a row land on the same scale.
 */
import { TECHNIQUES, getSubject, keysFor, type Drill } from './drills'
import { seededOrder } from './drill-moves'

/** A calendar day in the writer's own time zone, as "YYYY-MM-DD". */
export function dayKey(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Days since 1970-01-01 for a "YYYY-MM-DD" key, independent of the time zone. */
function dayNumber(day: string): number {
  const [y, m, d] = day.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
}

export function previousDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  return dayKey(new Date(y, m - 1, d - 1))
}

type Entry = { techniqueId: string; key: string }

let pool: Entry[] | null = null

function dailyPool(): Entry[] {
  if (pool) return pool
  const all = TECHNIQUES.flatMap((t) => keysFor(t).map((key) => ({ techniqueId: t.id, key })))
  const shuffled = seededOrder(all.length, 'daily-puzzle').map((i) => all[i])
  // Spread out neighbours from the same scale, so tomorrow is never today's scale again.
  for (let i = 1; i < shuffled.length; i++) {
    if (shuffled[i].techniqueId !== shuffled[i - 1].techniqueId) continue
    const j = shuffled.findIndex((e, k) => k > i && e.techniqueId !== shuffled[i - 1].techniqueId)
    if (j > 0) [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  pool = shuffled
  return pool
}

/** The daily puzzle for a "YYYY-MM-DD" day. */
export function dailyDrill(day: string): Drill {
  const entries = dailyPool()
  const n = dayNumber(day)
  const { techniqueId, key } = entries[((n % entries.length) + entries.length) % entries.length]
  const subject = getSubject(key)
  if (!subject) return { techniqueId, subjectId: key, seed: '' }
  // The seed rotates too, so a subject that comes back brings a new prompt.
  return { techniqueId, subjectId: key, seed: subject.seeds[Math.floor(n / entries.length) % subject.seeds.length] }
}

export function isSameDrill(a: Drill, b: Drill): boolean {
  return a.techniqueId === b.techniqueId && a.subjectId === b.subjectId && a.seed === b.seed
}

/** The last day the daily puzzle was finished, and the run of consecutive days. */
export interface DailyRecord {
  day: string
  streak: number
  best: number
}

export const NO_DAILY: DailyRecord = { day: '', streak: 0, best: 0 }

/** Records the daily puzzle finished on `day`. Finishing it again the same day changes nothing. */
export function recordDaily(record: DailyRecord, day: string): DailyRecord {
  if (record.day === day) return record
  const streak = record.day === previousDay(day) ? record.streak + 1 : 1
  return { day, streak, best: Math.max(record.best, streak) }
}

/** The streak as it stands today: still alive if the last daily was today or yesterday. */
export function dailyStreak(record: DailyRecord, today: string): number {
  return record.day === today || record.day === previousDay(today) ? record.streak : 0
}
