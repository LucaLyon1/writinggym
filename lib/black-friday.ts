/**
 * Black Friday yearly offer.
 *
 * One source of truth for the promo code, the live window, and which plans it
 * applies to. The checkout and the in-app surfaces both read from here, so the
 * price a buyer is shown and the price Whop charges cannot drift apart.
 *
 * The Whop side must match, or the checkout opens at full price with the
 * reason printed on the promo row:
 *
 *   code      BLACKFRIDAY26
 *   discount  flat $20 off, USD
 *   variants  plan_1E7RwuJBhlZBZ (Core yearly), plan_6J4pmbiBtZAD0 (Premium yearly)
 *   duration  forever, so renewals stay at $79 and the "your rate stays while
 *             you stay subscribed" promise on /pricing holds
 *   expires   2026-11-30T23:59:59Z, the last minute of Cyber Monday in London
 *   limits    one per customer
 */

export const BLACK_FRIDAY_PROMO_CODE = 'BLACKFRIDAY26'

/**
 * Wednesday 25 November 2026, 00:00 UTC. Brought forward from Thursday 18:00
 * so the offer is live and testable in production before the launch email.
 * The end date is unchanged, so the sale simply runs a day and a half longer.
 */
export const BLACK_FRIDAY_STARTS_AT = Date.parse('2026-11-25T00:00:00Z')

/** Monday 30 November 2026, 23:59:59 UTC. Europe/London is UTC in November. */
export const BLACK_FRIDAY_ENDS_AT = Date.parse('2026-11-30T23:59:59Z')

export function isBlackFridayActive(now: number = Date.now()): boolean {
  return now >= BLACK_FRIDAY_STARTS_AT && now <= BLACK_FRIDAY_ENDS_AT
}

/**
 * The code is scoped to the yearly variants. Returning undefined for monthly
 * keeps those checkouts clean: Whop would reject an inapplicable code and print
 * the reason on the promo row of a plan that was never discounted.
 */
export function getBlackFridayPromoCode(
  planKey: string,
  now: number = Date.now()
): string | undefined {
  if (!planKey.endsWith('-yearly')) return undefined
  return isBlackFridayActive(now) ? BLACK_FRIDAY_PROMO_CODE : undefined
}
