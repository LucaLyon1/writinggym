import { Whop } from '@whop/sdk'

export const WHOP_ACCOUNT_ID = process.env.WHOP_ACCOUNT_ID ?? 'biz_tGIL6R2J3Z0k5p'
export const WHOP_PRODUCT_ID = process.env.WHOP_PRODUCT_ID ?? 'prod_gOqq98A2Us54W'
export const WHOP_PUBLIC_FORUM_EXPERIENCE_ID =
  process.env.WHOP_PUBLIC_FORUM_EXPERIENCE_ID ?? 'exp_tnWXo8jYEONzgK'
export const WHOP_GENERAL_CHAT_CHANNEL_ID =
  process.env.WHOP_GENERAL_CHAT_CHANNEL_ID ?? 'chat_feed_1CeHaJJyu9zGB32AV5oDSj'
export const WHOP_LOCAL_CHAT_CHANNEL_ID =
  process.env.WHOP_LOCAL_CHAT_CHANNEL_ID ?? 'chat_feed_1CeHdRxgaX1ergR511Vmgn'

export function isProdWhopChat() {
  return process.env.VERCEL_ENV === 'production' || process.env.WHOP_USE_PROD_CHAT === '1'
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

export function getWhopClient(): Whop {
  const apiKey = process.env.WHOP_API_KEY
  if (!apiKey) {
    throw new Error('WHOP_API_KEY is not configured')
  }

  const rawWebhookSecret = process.env.WHOP_WEBHOOK_SECRET
  const webhookKey = rawWebhookSecret
    ? Buffer.from(rawWebhookSecret).toString('base64')
    : null

  return new Whop({
    apiKey,
    webhookKey,
    version: '2026-08-13',
  })
}
