import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  isWhopManageUrl,
  NO_EXTERNAL_BILLING_MESSAGE,
  resolveBillingPortalTarget,
  WHOP_MEMBERSHIPS_URL,
} from './billing-portal.ts'

test('whop rows use the membership manage_url', () => {
  const url = 'https://whop.com/billing/manage/mber_abc123/'
  assert.deepEqual(
    resolveBillingPortalTarget({ billing_provider: 'whop', manage_url: url, stripe_customer_id: null }),
    { kind: 'whop', url }
  )
})

test('whop rows without a manage_url fall back to the memberships page', () => {
  assert.deepEqual(
    resolveBillingPortalTarget({ billing_provider: 'whop', manage_url: null, stripe_customer_id: null }),
    { kind: 'whop', url: WHOP_MEMBERSHIPS_URL }
  )
})

test('non-Whop manage_url values are never used as a redirect', () => {
  for (const bad of ['https://evil.example/whop.com', 'http://whop.com/billing/manage/x', 'javascript:alert(1)', 'not a url']) {
    assert.equal(isWhopManageUrl(bad), false, bad)
    assert.deepEqual(
      resolveBillingPortalTarget({ billing_provider: 'whop', manage_url: bad, stripe_customer_id: null }),
      { kind: 'whop', url: WHOP_MEMBERSHIPS_URL }
    )
  }
})

test('stripe rows with a customer go to the Stripe portal', () => {
  assert.deepEqual(
    resolveBillingPortalTarget({ billing_provider: 'stripe', manage_url: null, stripe_customer_id: 'cus_123' }),
    { kind: 'stripe', customerId: 'cus_123' }
  )
})

test('comp rows with no billing account get a message, not a redirect', () => {
  assert.deepEqual(
    resolveBillingPortalTarget({ billing_provider: 'stripe', manage_url: null, stripe_customer_id: null }),
    { kind: 'none', message: NO_EXTERNAL_BILLING_MESSAGE }
  )
})
