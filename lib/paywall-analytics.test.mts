import assert from 'node:assert/strict'
import { test } from 'node:test'
import { paywallFeatureFromPath, whopReceiptIdFromParams } from './paywall-analytics.ts'

test('paywallFeatureFromPath uses the first path segment', () => {
  assert.equal(paywallFeatureFromPath('/extract/woolf-dalloway-open'), 'extract')
  assert.equal(paywallFeatureFromPath('/playground'), 'playground')
  assert.equal(paywallFeatureFromPath('/'), 'home')
  assert.equal(paywallFeatureFromPath(''), 'home')
  assert.equal(paywallFeatureFromPath(null), 'home')
})

test('whopReceiptIdFromParams reads Elements and legacy return params', () => {
  assert.equal(whopReceiptIdFromParams({ receipt: 'pay_legacy1' }), 'pay_legacy1')
  assert.equal(
    whopReceiptIdFromParams({ receipt_id: 'pay_elements1', payment_id: 'pay_elements1' }),
    'pay_elements1'
  )
  assert.equal(whopReceiptIdFromParams({ payment_id: 'pay_only1' }), 'pay_only1')
  assert.equal(whopReceiptIdFromParams({ receipt_id: ['pay_first1', 'pay_second1'] }), 'pay_first1')
})

test('whopReceiptIdFromParams ignores missing or malformed ids', () => {
  assert.equal(whopReceiptIdFromParams({}), undefined)
  assert.equal(whopReceiptIdFromParams({ receipt_id: 'chs_notapayment' }), undefined)
  assert.equal(whopReceiptIdFromParams({ receipt: 'pay_bad id' }), undefined)
})
