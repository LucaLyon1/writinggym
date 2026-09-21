import { Whop } from '@whop/sdk'
import type { UnwrapWebhookEvent } from '@whop/sdk/resources/webhooks'
import { Webhook } from 'standardwebhooks'

export const WHOP_ACCOUNT_ID = process.env.WHOP_ACCOUNT_ID ?? 'biz_tGIL6R2J3Z0k5p'
export const WHOP_PRODUCT_ID = process.env.WHOP_PRODUCT_ID ?? 'prod_OFqlk4hW26pBI'
/** Premium plans still live on the legacy product until Premium is remapped. */
export const WHOP_PREMIUM_PRODUCT_ID =
  process.env.WHOP_PREMIUM_PRODUCT_ID ?? 'prod_gOqq98A2Us54W'

export function isAllowedWhopProductId(productId: string | null | undefined): boolean {
  return productId === WHOP_PRODUCT_ID || productId === WHOP_PREMIUM_PRODUCT_ID
}
export const WHOP_PUBLIC_FORUM_EXPERIENCE_ID =
  process.env.WHOP_PUBLIC_FORUM_EXPERIENCE_ID ?? 'exp_tnWXo8jYEONzgK'
export const WHOP_GENERAL_CHAT_CHANNEL_ID =
  process.env.WHOP_GENERAL_CHAT_CHANNEL_ID ?? 'chat_feed_1CeHaJJyu9zGB32AV5oDSj'
export const WHOP_LOCAL_CHAT_CHANNEL_ID =
  process.env.WHOP_LOCAL_CHAT_CHANNEL_ID ?? 'chat_feed_1CeHdRxgaX1ergR511Vmgn'

export function isProdWhopChat() {
  return (
    process.env.VERCEL_ENV === 'production' ||
    process.env.NODE_ENV === 'production' ||
    process.env.WHOP_USE_PROD_CHAT === '1'
  )
}

export function getCommunityChatChannelId() {
  if (process.env.WHOP_CHAT_CHANNEL_ID) return process.env.WHOP_CHAT_CHANNEL_ID
  return isProdWhopChat() ? WHOP_GENERAL_CHAT_CHANNEL_ID : WHOP_LOCAL_CHAT_CHANNEL_ID
}

export async function getOrCreateSupportChannelId(whopUserId: string): Promise<string> {
  const channel = await getWhopClient().supportChannels.create({
    company_id: WHOP_ACCOUNT_ID,
    user_id: whopUserId,
  })
  return channel.id
}

export function getWhopBillingPortalUrl(memberId: string | null | undefined): string | null {
  if (!memberId || !/^mber_[A-Za-z0-9]+$/.test(memberId)) return null
  return `https://whop.com/billing/manage/${memberId}/`
}

function headersToRecord(headers: Headers | Record<string, string>): Record<string, string> {
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries())
  }
  return headers
}

/**
 * Verify a Whop webhook with standardwebhooks.
 *
 * - `ws_…` secrets: HMAC key is the raw UTF-8 secret string (`format: 'raw'`).
 *   Equivalent to the old `Buffer.from(secret).toString('base64')` + default Webhook
 *   path used by the SDK unwrap helper — do NOT hex-decode after stripping `ws_`.
 * - `whsec_…` secrets: library strips the prefix and base64-decodes.
 * - Anything else: treat as already-base64 key material (legacy mistaken env).
 */
export function verifyWhopWebhook(
  body: string,
  headers: Headers | Record<string, string>
): UnwrapWebhookEvent {
  const secret = process.env.WHOP_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('WHOP_WEBHOOK_SECRET is not configured')
  }

  const wh = secret.startsWith('ws_')
    ? new Webhook(secret, { format: 'raw' })
    : new Webhook(secret)

  wh.verify(body, headersToRecord(headers))
  return JSON.parse(body) as UnwrapWebhookEvent
}

export function getWhopClient(): Whop {
  const apiKey = process.env.WHOP_API_KEY
  if (!apiKey) {
    throw new Error('WHOP_API_KEY is not configured')
  }

  return new Whop({
    apiKey,
    version: '2026-08-13',
  })
}
