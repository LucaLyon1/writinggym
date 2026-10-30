'use client'

import { useMemo, useSyncExternalStore } from 'react'
import { CompletionHeatmap } from '@/components/CompletionHeatmap'
import { StreakBadges } from '@/components/StreakBadges'
import { parseProgress, progressSnapshot, subscribeProgress } from '@/components/drills/progress'
import { drillActivityDays, mergedStreak, type DrillDays } from '@/lib/drill-activity'
import { dayKey } from '@/lib/drills-daily'

type Props = {
  completions: { completed_at: string }[]
  currentStreak: number
  longestStreak: number
  totalWordsWritten: number
  totalPassages: number
}

const NO_DRILLS: DrillDays = {}

/**
 * The profile heatmap and streak, with drills added in. Drill progress lives
 * in this browser, so the server renders writing only and drills join after
 * mount (the server snapshot is null), which keeps hydration consistent.
 */
export function ProfileActivity({ completions, currentStreak, longestStreak, totalWordsWritten, totalPassages }: Props) {
  const raw = useSyncExternalStore(subscribeProgress, progressSnapshot, () => null)

  const { drillDays, streak } = useMemo(() => {
    const server = { current: currentStreak, longest: longestStreak }
    if (raw === null) return { drillDays: NO_DRILLS, streak: server }
    const days = drillActivityDays(parseProgress(raw))
    return { drillDays: days, streak: mergedStreak(server, completions, days, dayKey()) }
  }, [raw, completions, currentStreak, longestStreak])

  return (
    <>
      <CompletionHeatmap
        completions={completions}
        currentStreak={streak.current}
        longestStreak={streak.longest}
        totalWordsWritten={totalWordsWritten}
        totalPassages={totalPassages}
        drillDays={drillDays}
      />
      <StreakBadges currentStreak={streak.current} />
    </>
  )
}
