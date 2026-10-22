/**
 * Shared helpers for paywall and checkout analytics, kept free of React and
 * PostHog imports so they can be unit tested.
 */

export type PaywallSource = 'free_user_gate' | 'post_trial_paywall'
export type CheckoutSource = PaywallSource | 'pricing_page'

/**
 * The app area a hard paywall blocked, taken from the first path segment
 * (e.g. `/extract/woolf` → `extract`). The home page reports `home`.
 */
export function paywallFeatureFromPath(pathname: string | null | undefined): string {
  const segment = (pathname ?? '').split('/').filter(Boolean)[0]
  return segment ? segment.toLowerCase() : 'home'
}

/**
 * Whop's legacy checkout returned `?receipt=pay_…`; Whop Elements returns
 * `?receipt_id=pay_…&payment_id=pay_…`. Accept all three so the checkout
 * complete page can reconcile the purchase either way.
 */
export function whopReceiptIdFromParams(params: {
  receipt?: string | string[]
  receipt_id?: string | string[]
  payment_id?: string | string[]
}): string | undefined {
  for (const value of [params.receipt, params.receipt_id, params.payment_id]) {
    const candidate = Array.isArray(value) ? value[0] : value
    if (typeof candidate === 'string' && /^pay_[A-Za-z0-9]+$/.test(candidate)) {
      return candidate
    }
  }
  return undefined
}
