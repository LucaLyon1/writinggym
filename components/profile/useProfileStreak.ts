'use client'

import { useMemo, useSyncExternalStore } from 'react'
import { parseProgress, progressSnapshot, subscribeProgress } from '@/components/drills/progress'
import { drillActivityDays, mergedStreak, type DrillDays } from '@/lib/drill-activity'
import { dayKey } from '@/lib/drills-daily'

export type ProfileStreakInput = {
  completions: { completed_at: string }[]
  currentStreak: number
  longestStreak: number
}

const NO_DRILLS: DrillDays = {}

/**
 * The profile streak with drills added in. Drill progress lives in this
 * browser, so the server renders writing only and drills join after mount
 * (the server snapshot is null), which keeps hydration consistent.
 */
export function useProfileStreak({ completions, currentStreak, longestStreak }: ProfileStreakInput) {
  const raw = useSyncExternalStore(subscribeProgress, progressSnapshot, () => null)

  return useMemo(() => {
    const server = { current: currentStreak, longest: longestStreak }
    if (raw === null) return { drillDays: NO_DRILLS, streak: server }
    const days = drillActivityDays(parseProgress(raw))
    return { drillDays: days, streak: mergedStreak(server, completions, days, dayKey()) }
  }, [raw, completions, currentStreak, longestStreak])
}
