import { Whop } from '@whop/sdk'

export const WHOP_ACCOUNT_ID = process.env.WHOP_ACCOUNT_ID ?? 'biz_tGIL6R2J3Z0k5p'
export const WHOP_PRODUCT_ID = process.env.WHOP_PRODUCT_ID ?? 'prod_gOqq98A2Us54W'

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
