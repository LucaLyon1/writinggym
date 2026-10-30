/**
 * Drill progress kept in the browser for now (stars and streak).
 * Moving this to Supabase is planned; see docs/drills-research-and-plan.md.
 */
import type { SolvedMap } from '@/lib/drills'
import { NO_DAILY, type DailyRecord } from '@/lib/drills-daily'
import { parseDrillDays, recordDrillDay, type DrillDays } from '@/lib/drill-activity'

export interface DrillProgress {
  solved: SolvedMap
  streak: number
  bestStreak: number
  muted: boolean
  /** The daily puzzle: last day finished and the run of days. */
  daily: DailyRecord
  /** Drills finished per local day, for the profile heatmap. Recorded since Oct 2026; older saves have none. */
  days: DrillDays
}

const KEY = 'proselab.drills.progress.v2'
export const EMPTY_PROGRESS: DrillProgress = { solved: {}, streak: 0, bestStreak: 0, muted: false, daily: NO_DAILY, days: {} }
const EMPTY = EMPTY_PROGRESS

export function loadProgress(): DrillProgress {
  return parseProgress(progressSnapshot())
}

/** The stored progress as raw text: a stable snapshot for useSyncExternalStore. */
export function progressSnapshot(): string | null {
  try {
    return window.localStorage.getItem(KEY)
  } catch {
    return null
  }
}

/** Follows progress saved from another tab. */
export function subscribeProgress(onChange: () => void): () => void {
  window.addEventListener('storage', onChange)
  return () => window.removeEventListener('storage', onChange)
}

export function parseProgress(raw: string | null): DrillProgress {
  try {
    if (!raw) return EMPTY
    const data = JSON.parse(raw) as Partial<DrillProgress>
    return {
      solved: data.solved && typeof data.solved === 'object' ? data.solved : {},
      streak: Number(data.streak) || 0,
      bestStreak: Number(data.bestStreak) || 0,
      muted: data.muted === true,
      daily: parseDaily(data.daily),
      days: parseDrillDays(data.days),
    }
  } catch {
    return EMPTY
  }
}

function parseDaily(raw: unknown): DailyRecord {
  if (!raw || typeof raw !== 'object') return NO_DAILY
  const d = raw as Partial<DailyRecord>
  return {
    day: typeof d.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.day) ? d.day : '',
    streak: Number(d.streak) || 0,
    best: Number(d.best) || 0,
  }
}

export function saveProgress(progress: DrillProgress) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(progress))
  } catch {
    // Progress is a convenience until it is stored server-side.
  }
}

/**
 * Records a puzzle finished on `day` (the writer's local "YYYY-MM-DD").
 * Every finished puzzle counts for the day; only clean solves earn a star and grow the streak.
 */
export function recordPuzzle(p: DrillProgress, techniqueId: string, subjectId: string, clean: boolean, day: string): DrillProgress {
  const days = recordDrillDay(p.days, day)
  if (!clean) return { ...p, streak: 0, days }
  const subjects = p.solved[techniqueId] ?? []
  const streak = p.streak + 1
  return {
    ...p,
    days,
    solved: { ...p.solved, [techniqueId]: subjects.includes(subjectId) ? subjects : [...subjects, subjectId] },
    streak,
    bestStreak: Math.max(p.bestStreak, streak),
  }
}
