'use client'

import { CompletionHeatmap } from '@/components/CompletionHeatmap'
import { StreakBadges } from '@/components/StreakBadges'
import { useProfileStreak } from '@/components/profile/useProfileStreak'

type Props = {
  completions: { completed_at: string }[]
  currentStreak: number
  longestStreak: number
  totalWordsWritten: number
  totalPassages: number
}

/** The profile heatmap and streak badges, with drills added in. */
export function ProfileActivity({ completions, currentStreak, longestStreak, totalWordsWritten, totalPassages }: Props) {
  const { drillDays, streak } = useProfileStreak({ completions, currentStreak, longestStreak })

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
