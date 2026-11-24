import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  BLACK_FRIDAY_ENDS_AT,
  BLACK_FRIDAY_PROMO_CODE,
  BLACK_FRIDAY_STARTS_AT,
  getBlackFridayPromoCode,
  isBlackFridayActive,
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
