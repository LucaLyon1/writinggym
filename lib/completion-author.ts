/** Select fragment for embedding author profile fields on passage_completions. */
export const COMPLETION_AUTHOR_PROFILE_SELECT =
  'profiles(username, current_streak, show_streak_badge, is_founding_member)'

export type CompletionAuthorPayload = {
  username: string | null
  current_streak: number
  show_streak_badge: boolean
  is_founding_member: boolean
}

export function completionAuthorFromProfileEmbed(embed: unknown): CompletionAuthorPayload {
  let raw = embed
  if (Array.isArray(raw)) raw = raw[0]
  if (!raw || typeof raw !== 'object') {
    return {
      username: null,
      current_streak: 0,
      show_streak_badge: false,
      is_founding_member: false,
    }
  }
  const o = raw as Record<string, unknown>
  return {
    username: typeof o.username === 'string' ? o.username : null,
    current_streak: typeof o.current_streak === 'number' ? o.current_streak : 0,
    show_streak_badge: o.show_streak_badge === true,
    is_founding_member: o.is_founding_member === true,
  }
}
