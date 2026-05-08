import { getCurrentBadge } from '@/lib/streak-badges'
import type { CompletionAuthorPayload } from '@/lib/completion-author'

type Props = {
  author: CompletionAuthorPayload
  className?: string
}

export function PublicAuthorAttribution({ author, className }: Props) {
  const displayName = author.username?.trim() || 'Writer'
  const badge = author.show_streak_badge ? getCurrentBadge(author.current_streak) : null

  return (
    <span className={className ?? 'public-author-attribution'}>
      <span className="public-author-name">{displayName}</span>
      {author.is_founding_member ? (
        <span
          className="public-author-founding-badge"
          title="Founding Member — supported rewrite during pre-release"
          aria-label="Founding Member badge"
        >
          <span aria-hidden>🚀</span>
        </span>
      ) : null}
      {badge ? (
        <span className="public-author-badge" title={badge.label} aria-label={`Streak badge: ${badge.label}`}>
          <span aria-hidden>{badge.emoji}</span>
        </span>
      ) : null}
    </span>
  )
}
