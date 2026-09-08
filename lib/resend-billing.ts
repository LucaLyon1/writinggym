import { Resend } from 'resend'

/** Fallback paid tier when status is paid but no app plan_id is available. */
export const RESEND_PAID_PLAN_TIER = 'core'
export const RESEND_FREE_PLAN_TIER = 'free'
export const DEFAULT_RESEND_PAYING_SEGMENT_ID = '0b13ca48-a871-4a75-835a-84d4fa5127f5'

const PAID_STATUSES = new Set(['active', 'trialing'])
const FREE_STATUSES = new Set([
  'canceled',
  'expired',
  'incomplete_expired',
  'unpaid',
])

type ResendError = {
  message: string
  statusCode: number | null
  name: string
}

type ResendResult<T> = {
  data: T | null
  error: ResendError | null
}

export type ResendBillingClient = {
  contacts: {
    create: (options: {
      email: string
      properties?: Record<string, string | number | null>
      segments?: { id: string }[]
    }) => Promise<ResendResult<{ id: string }>>
    update: (options: {
      email: string
      properties?: Record<string, string | number | null>
    }) => Promise<ResendResult<{ id: string }>>
    segments: {
      add: (options: {
        email: string
        segmentId: string
      }) => Promise<ResendResult<{ id: string }>>
      remove: (options: {
        email: string
        segmentId: string
      }) => Promise<ResendResult<{ id: string; deleted: boolean }>>
    }
  }
}

export interface ResendBillingContactInput {
  email: string
  status: string
  /** App subscription plan_id (`core`, `premium`, `pre_release_yearly`, …). */
  planId?: string | null
}

export type ResendBillingContactResult =
  | { outcome: 'unchanged' }
  | { outcome: 'updated'; planTier: string }
  | { outcome: 'created'; planTier: string }

/**
 * Paying Users is all payers. Paid access writes the subscription's app
 * `plan_id` into Resend `plan_tier` (core, premium, pre_release_yearly, …).
 * Terminal free states map to `free`. Transitional statuses leave Resend
 * unchanged so temporary payment problems do not bounce the contact.
 */
export function getResendPlanTierForBillingStatus(
  status: string,
  planId?: string | null
): string | null {
  const normalizedStatus = status.trim().toLowerCase()

  if (PAID_STATUSES.has(normalizedStatus)) {
    const normalizedPlanId = planId?.trim()
    if (!normalizedPlanId || normalizedPlanId.toLowerCase() === 'free') {
      return RESEND_PAID_PLAN_TIER
    }
    return normalizedPlanId
  }

  if (FREE_STATUSES.has(normalizedStatus)) return RESEND_FREE_PLAN_TIER
  return null
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function getPayingSegmentId(): string {
  return process.env.RESEND_PAYING_SEGMENT_ID?.trim() || DEFAULT_RESEND_PAYING_SEGMENT_ID
}

function createResendClient(): ResendBillingClient {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  return new Resend(apiKey) as unknown as ResendBillingClient
}

function isNotFoundError(error: ResendError | null | undefined): boolean {
  if (!error) return false
  if (error.name === 'not_found' || error.statusCode === 404) return true
  return /not found|does not exist|missing contact/i.test(error.message)
}

function isIgnorableSegmentAddError(error: ResendError | null | undefined): boolean {
  if (!error) return false
  if (isNotFoundError(error)) return false
  return /already (?:in|a member|belongs)|exists in segment|duplicate/i.test(error.message)
}

function isIgnorableSegmentRemoveError(error: ResendError | null | undefined): boolean {
  if (!error) return false
  if (isNotFoundError(error)) return true
  return /not (?:in|a member)|does not belong|not found in segment/i.test(error.message)
}

function assertOk(label: string, error: ResendError | null | undefined): void {
  if (!error) return
  throw new Error(`Resend ${label} failed: ${error.message}`)
}

async function ensurePayingSegmentMembership(
  client: ResendBillingClient,
  email: string,
  isPaid: boolean,
  segmentId: string
): Promise<void> {
  if (isPaid) {
    const { error } = await client.contacts.segments.add({ email, segmentId })
    if (error && !isIgnorableSegmentAddError(error)) {
      assertOk('Paying Users segment add', error)
    }
    return
  }

  const { error } = await client.contacts.segments.remove({ email, segmentId })
  if (error && !isIgnorableSegmentRemoveError(error)) {
    assertOk('Paying Users segment remove', error)
  }
}

/**
 * Keep Resend `plan_tier` and Paying Users segment membership aligned with
 * durable billing access. Failures throw so Whop/Stripe webhooks can retry.
 */
export async function syncResendBillingContact(
  input: ResendBillingContactInput,
  client?: ResendBillingClient
): Promise<ResendBillingContactResult> {
  const planTier = getResendPlanTierForBillingStatus(input.status, input.planId)
  if (!planTier) return { outcome: 'unchanged' }

  const isPaid = planTier !== RESEND_FREE_PLAN_TIER
  const email = normalizeEmail(input.email)
  const segmentId = getPayingSegmentId()
  const resend = client ?? createResendClient()

  const updateResult = await resend.contacts.update({
    email,
    properties: { plan_tier: planTier },
  })

  if (updateResult.error && isNotFoundError(updateResult.error)) {
    const createResult = await resend.contacts.create({
      email,
      properties: { plan_tier: planTier },
      ...(isPaid ? { segments: [{ id: segmentId }] } : {}),
    })
    assertOk('contact create', createResult.error)
    return { outcome: 'created', planTier }
  }

  assertOk('contact update', updateResult.error)
  await ensurePayingSegmentMembership(resend, email, isPaid, segmentId)
  return { outcome: 'updated', planTier }
}
