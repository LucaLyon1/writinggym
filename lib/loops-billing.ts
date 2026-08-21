import { LoopsClient } from 'loops'

export const LOOPS_PAID_USER_GROUP = 'Core User'
export const LOOPS_FREE_USER_GROUP = 'Free User'

const PAID_STATUSES = new Set(['active', 'trialing'])
const FREE_STATUSES = new Set([
  'canceled',
  'expired',
  'incomplete_expired',
  'unpaid',
])

type LoopsContactUpdater = Pick<LoopsClient, 'updateContact'>

export interface LoopsBillingContactInput {
  email: string
  status: string
  userId: string
}

export type LoopsBillingContactResult =
  | { outcome: 'unchanged' }
  | { outcome: 'updated'; userGroup: string }

/**
 * Keep scheduled cancellations and temporary payment failures in the paid
 * group. They should leave the purchase sequence only when access is actually
 * inactive.
 */
export function getLoopsUserGroupForBillingStatus(status: string): string | null {
  const normalizedStatus = status.trim().toLowerCase()

  if (PAID_STATUSES.has(normalizedStatus)) return LOOPS_PAID_USER_GROUP
  if (FREE_STATUSES.has(normalizedStatus)) return LOOPS_FREE_USER_GROUP
  return null
}

function createLoopsClient(): LoopsContactUpdater {
  const apiKey = process.env.LOOPS_API_KEY
  if (!apiKey) {
    throw new Error('LOOPS_API_KEY is not configured')
  }

  return new LoopsClient(apiKey)
}

/**
 * Upsert the billing state onto the existing Loops contact. Loops accepts both
 * identifiers on update, which also repairs an email change while preserving
 * the stable Supabase user ID used by the signup webhook.
 */
export async function syncLoopsBillingContact(
  input: LoopsBillingContactInput,
  client?: LoopsContactUpdater
): Promise<LoopsBillingContactResult> {
  const userGroup = getLoopsUserGroupForBillingStatus(input.status)
  if (!userGroup) return { outcome: 'unchanged' }

  const loops = client ?? createLoopsClient()
  await loops.updateContact({
    email: input.email,
    userId: input.userId,
    properties: { userGroup },
  })

  return { outcome: 'updated', userGroup }
}
