/**
 * Decide where "Manage billing" should send a subscriber.
 *
 * Kept free of Stripe/Supabase imports so the route, the settings page and
 * tests can all share it.
 */

/** Whop's customer-facing list of memberships; used when a row has no manage_url. */
export const WHOP_MEMBERSHIPS_URL = 'https://whop.com/@me/settings/memberships/'

export const NO_EXTERNAL_BILLING_MESSAGE =
  'Your plan was set up directly by ProseLab, so there are no payment details to manage. Email contact@proselab.io if you need to change it.'

/** Statuses that can still be managed (past_due so the card can be fixed). */
export const MANAGEABLE_STATUSES = ['active', 'trialing', 'past_due'] as const

export interface BillingPortalSubscription {
  billing_provider: string | null
  manage_url: string | null
  stripe_customer_id: string | null
}

export type BillingPortalTarget =
  | { kind: 'whop'; url: string }
  | { kind: 'stripe'; customerId: string }
  | { kind: 'none'; message: string }

/** Only ever redirect to Whop over HTTPS, never to an arbitrary stored URL. */
export function isWhopManageUrl(value: string | null | undefined): value is string {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && (url.hostname === 'whop.com' || url.hostname.endsWith('.whop.com'))
  } catch {
    return false
  }
}

export function resolveBillingPortalTarget(
  subscription: BillingPortalSubscription
): BillingPortalTarget {
  if (subscription.billing_provider === 'whop') {
    // Prefer the membership-specific manage_url Whop returns on the membership
    // (https://whop.com/billing/manage/mber_…/): it opens straight onto this
    // membership's card, plan and cancellation controls.
    return {
      kind: 'whop',
      url: isWhopManageUrl(subscription.manage_url) ? subscription.manage_url : WHOP_MEMBERSHIPS_URL,
    }
  }

  if (subscription.stripe_customer_id) {
    return { kind: 'stripe', customerId: subscription.stripe_customer_id }
  }

  // Comp/manual rows: a paid plan with no external billing account behind it.
  return { kind: 'none', message: NO_EXTERNAL_BILLING_MESSAGE }
}
