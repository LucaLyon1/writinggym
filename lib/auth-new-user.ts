/**
 * Decide whether an auth callback is a genuine signup from the auth user's
 * `created_at`. Older accounts often have no `profiles.username`, so that
 * field is not a reliable new-user signal.
 */
export const NEW_AUTH_USER_WINDOW_MS = 10 * 60 * 1000

/** Allow a little clock skew so a just-created user is not missed. */
const CLOCK_SKEW_MS = 60 * 1000

export function isNewlyCreatedAuthUser(
  createdAt: string | null | undefined,
  now: Date = new Date(),
  windowMs: number = NEW_AUTH_USER_WINDOW_MS
): boolean {
  if (typeof createdAt !== 'string' || createdAt.trim() === '') return false
  const createdMs = Date.parse(createdAt)
  if (Number.isNaN(createdMs)) return false
  const ageMs = now.getTime() - createdMs
  return ageMs <= windowMs && ageMs >= -CLOCK_SKEW_MS
}
