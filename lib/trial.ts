/**
 * Free-trial window for new accounts.
 * Anchored to auth.users.created_at so pre-existing users get paywalled
 * immediately on their next nav while genuinely new signups get 168h.
 */
export const TRIAL_DURATION_HOURS = 168

export function isWithinFreeTrial(createdAt: string | Date | null | undefined): boolean {
  if (!createdAt) return false
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  if (Number.isNaN(created.getTime())) return false
  const trialEndMs = created.getTime() + TRIAL_DURATION_HOURS * 60 * 60 * 1000
  return Date.now() < trialEndMs
}

/**
 * Days remaining in the free trial, rounded up. Returns null if the user
 * has no created_at, the timestamp is invalid, or the trial has expired.
 */
export function trialDaysLeft(createdAt: string | Date | null | undefined): number | null {
  if (!createdAt) return null
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  if (Number.isNaN(created.getTime())) return null
  const trialEndMs = created.getTime() + TRIAL_DURATION_HOURS * 60 * 60 * 1000
  const msLeft = trialEndMs - Date.now()
  if (msLeft <= 0) return null
  return Math.ceil(msLeft / (24 * 60 * 60 * 1000))
}
