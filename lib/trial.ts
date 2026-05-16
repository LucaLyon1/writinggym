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
