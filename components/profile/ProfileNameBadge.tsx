'use client'

import { getCurrentBadge, getNextBadge, daysUntilNextBadge } from '@/lib/streak-badges'
import { StreakBadgeIcon } from '@/components/StreakBadgeIcon'
import { useShowStreakBadge } from '@/components/profile/streak-badge-pref'
import { useProfileStreak, type ProfileStreakInput } from '@/components/profile/useProfileStreak'

/** The current streak level, shown beside the profile name (user can hide it). */
export function ProfileNameBadge(props: ProfileStreakInput) {
  const { streak } = useProfileStreak(props)
  const [show] = useShowStreakBadge()
  const badge = getCurrentBadge(streak.current)
  if (!show || !badge) return null

  const next = getNextBadge(streak.current)
  const days = daysUntilNextBadge(streak.current)
  const title = `${badge.label}: ${streak.current}-day streak${next && days != null ? `. ${next.label} in ${days} day${days === 1 ? '' : 's'}` : ''}`

  return (
    <span className="profile-name-badge" title={title} role="img" aria-label={title}>
      <StreakBadgeIcon badge={badge} size={26} />
      <span className="profile-name-badge-label" aria-hidden="true">{badge.label}</span>
    </span>
  )
}
