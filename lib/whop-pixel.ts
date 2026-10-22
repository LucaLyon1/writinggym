declare global {
  interface Window {
    whop?: {
      track: (
        event: string,
        data?: WhopTrackData,
      ) => void
    }
  }
}

/**
 * Optional payload for Whop pixel events (customer info + dedupe).
 *
 * Note: the current pixel script (t.whop.tw/s.js) only forwards `event_id`,
 * `value`, `currency`, `email` and `phone` on conversion events; other
 * fields are accepted here for forward compatibility but are dropped today.
 */
export type WhopTrackData = {
  value?: number
  currency?: string
  email?: string
  event_id?: string
  name?: string
  phone?: string
  external_id?: string
  first_name?: string
  last_name?: string
}

/**
 * Whop standard pixel events we send. Checkout views, payments,
 * subscriptions and trials on Whop checkout are recorded by Whop itself,
 * so never send `purchase` (or a checkout event) for a Whop sale.
 * https://docs.whop.com/developer/ads/pixel
 */
export type WhopConversionEvent =
  | 'lead'
  | 'complete_registration'
  | 'add_to_cart'
  | 'view_content'

export function trackWhopEvent(
  event: WhopConversionEvent,
  data?: WhopTrackData,
) {
  if (typeof window === 'undefined') return
  if (data && Object.keys(data).length > 0) {
    window.whop?.track(event, data)
  } else {
    window.whop?.track(event)
  }
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase()
}

function fnv1aHex(input: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

async function sha256Hex(input: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) return fnv1aHex(input)
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Stable `lead` event_id for one person. Whop counts each event name and
 * event_id pair once, so resubmitting the signup form (or the same email
 * arriving via another flow) collapses into a single lead. Matches the id
 * the landing site uses for the same email.
 */
export async function whopLeadEventId(email: string): Promise<string> {
  return `lead_${(await sha256Hex(normaliseEmail(email))).slice(0, 32)}`
}

/** Stable `complete_registration` event_id: one registration per account. */
export function whopRegistrationEventId(userId: string): string {
  return `registration_${userId}`
}
