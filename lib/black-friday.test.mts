import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BILLING_PLANS } from './billing-plans.ts'
import {
  BLACK_FRIDAY_DISCOUNT_USD,
  BLACK_FRIDAY_ENDS_AT,
  BLACK_FRIDAY_PROMO_CODE,
  BLACK_FRIDAY_STARTS_AT,
  blackFridayYearlyPriceUsd,
  formatUsd,
  getBlackFridayPromoCode,
  isBlackFridayActive,
  yearlyToMonthlyUsd,
} from './black-friday.ts'

test('the window is closed before the start', () => {
  assert.equal(isBlackFridayActive(BLACK_FRIDAY_STARTS_AT - 1), false)
})

test('the window opens on the start instant and closes on the end instant', () => {
  assert.equal(isBlackFridayActive(BLACK_FRIDAY_STARTS_AT), true)
  assert.equal(isBlackFridayActive(BLACK_FRIDAY_ENDS_AT), true)
})

test('the window is closed after Cyber Monday', () => {
  assert.equal(isBlackFridayActive(BLACK_FRIDAY_ENDS_AT + 1), false)
})

test('the window closes at 23:59:00Z, when the Whop promo expires', () => {
  assert.equal(BLACK_FRIDAY_ENDS_AT, Date.parse('2026-11-30T23:59:00Z'))
  assert.equal(isBlackFridayActive(Date.parse('2026-11-30T23:59:00Z')), true)
  assert.equal(isBlackFridayActive(Date.parse('2026-11-30T23:59:01Z')), false)
  assert.equal(isBlackFridayActive(Date.parse('2026-11-30T23:59:59Z')), false)
})

test('yearly plans carry the code while the window is open', () => {
  const during = BLACK_FRIDAY_STARTS_AT + 60_000
  assert.equal(getBlackFridayPromoCode('core-yearly', during), BLACK_FRIDAY_PROMO_CODE)
  assert.equal(getBlackFridayPromoCode('premium-yearly', during), BLACK_FRIDAY_PROMO_CODE)
})

test('monthly plans never carry the yearly code', () => {
  const during = BLACK_FRIDAY_STARTS_AT + 60_000
  assert.equal(getBlackFridayPromoCode('core-monthly', during), undefined)
  assert.equal(getBlackFridayPromoCode('premium-monthly', during), undefined)
})

test('no plan carries the code outside the window', () => {
  const before = BLACK_FRIDAY_STARTS_AT - 60_000
  const after = BLACK_FRIDAY_ENDS_AT + 60_000
  assert.equal(getBlackFridayPromoCode('core-yearly', before), undefined)
  assert.equal(getBlackFridayPromoCode('premium-yearly', after), undefined)
})

test('a flat $20 off the $99 yearly list price is $79', () => {
  assert.equal(BLACK_FRIDAY_DISCOUNT_USD, 20)
  assert.equal(blackFridayYearlyPriceUsd(99), 79)
  assert.equal(formatUsd(blackFridayYearlyPriceUsd(99)), '$79')
})

test('the Black Friday was-price is the monthly equivalent of the real yearly list price', () => {
  for (const key of ['core-yearly', 'premium-yearly'] as const) {
    const list = BILLING_PLANS[key].priceUsd
    const sale = blackFridayYearlyPriceUsd(list)
    assert.equal(list, 99)
    assert.equal(sale, 79)
    assert.equal(yearlyToMonthlyUsd(list), 8.25)
    assert.equal(yearlyToMonthlyUsd(sale), 6.58)
    assert.equal(formatUsd(yearlyToMonthlyUsd(list)), '$8.25')
    assert.equal(formatUsd(yearlyToMonthlyUsd(sale)), '$6.58')
  }
})

test('formatUsd drops trailing zeros on whole dollars', () => {
  assert.equal(formatUsd(20), '$20')
  assert.equal(formatUsd(99), '$99')
  assert.equal(formatUsd(8.25), '$8.25')
})
