import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  buildMembershipEvents,
  buildPurchaseEvents,
  deterministicUuid,
  resolvePurchaseIdentity,
  sendServerEvents,
  type CaptureClient,
  type ServerAnalyticsEvent,
} from './billing-analytics.ts'

const payment = {
  id: 'pay_abc123',
  total: 9.99,
  usd_total: 9.99,
  subtotal: 9.99,
  currency: 'usd',
  billing_reason: 'subscription_create',
  paid_at: '2026-11-20T20:57:00.000Z',
  created_at: '2026-11-20T20:56:00.000Z',
  membership: { id: 'mem_1' },
  plan: { id: 'plan_LHuMredoSf6M1' },
  promo_code: null,
}

const silent = { error: () => {}, warn: () => {} }

describe('deterministicUuid', () => {
  test('is stable, UUID-shaped and seed-specific', () => {
    const a = deterministicUuid('purchase_completed:pay_abc123')
    assert.equal(a, deterministicUuid('purchase_completed:pay_abc123'))
    assert.notEqual(a, deterministicUuid('purchase_completed:pay_other'))
    assert.match(a, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })
})

describe('buildPurchaseEvents', () => {
  test('first purchase sends one purchase_completed with revenue properties', () => {
    const events = buildPurchaseEvents({
      userId: 'user-1', payment, appPlanId: 'premium', interval: 'monthly', source: 'whop_webhook',
    })
    assert.equal(events.length, 1)
    const [e] = events
    assert.equal(e.event, 'purchase_completed')
    assert.equal(e.distinctId, 'user-1')
    assert.equal(e.timestamp?.toISOString(), payment.paid_at)
    assert.equal(e.uuid, deterministicUuid('purchase_completed:pay_abc123'))
    assert.equal(e.properties.plan_id, 'premium')
    assert.equal(e.properties.whop_plan_id, 'plan_LHuMredoSf6M1')
    assert.equal(e.properties.amount, 9.99)
    assert.equal(e.properties.revenue, 9.99)
    assert.equal(e.properties.$revenue, 9.99)
    assert.equal(e.properties.currency, 'USD')
    assert.equal(e.properties.interval, 'monthly')
    assert.equal(e.properties.is_renewal, false)
    assert.deepEqual(e.properties.$set, {
      plan_tier: 'premium', billing_interval: 'monthly', subscription_status: 'active', is_paying_customer: true,
    })
  })

  test('webhook and checkout sync produce the same uuid and timestamp (PostHog de-dupes)', () => {
    const a = buildPurchaseEvents({ userId: 'u', payment, appPlanId: 'premium', interval: 'monthly', source: 'whop_webhook' })[0]
    const b = buildPurchaseEvents({ userId: 'u', payment, appPlanId: 'premium', interval: 'monthly', source: 'checkout_sync' })[0]
    assert.equal(a.uuid, b.uuid)
    assert.equal(a.timestamp?.getTime(), b.timestamp?.getTime())
  })

  test('renewal also sends subscription_renewed', () => {
    const events = buildPurchaseEvents({
      userId: 'u', payment: { ...payment, billing_reason: 'subscription_cycle' },
      appPlanId: 'premium', interval: 'monthly', source: 'whop_webhook',
    })
    assert.deepEqual(events.map((e) => e.event), ['purchase_completed', 'subscription_renewed'])
    assert.equal(events[0].properties.is_renewal, true)
    assert.equal(events[1].properties.$set, undefined)
    assert.equal(events[1].properties.revenue, 9.99)
  })

  test('tolerates missing totals and timestamps', () => {
    const [e] = buildPurchaseEvents({
      userId: 'u',
      payment: { id: 'pay_x', total: null, subtotal: null, currency: null, paid_at: null, created_at: 'bad' },
      appPlanId: null, interval: null, source: 'whop_webhook',
    })
    assert.equal(e.properties.amount, null)
    assert.equal(e.properties.revenue, null)
    assert.equal(e.properties.currency, 'USD')
    assert.equal(e.timestamp, undefined)
  })
})

describe('buildMembershipEvents', () => {
  const base = {
    userId: 'u', webhookEventId: 'msg_1', appPlanId: 'premium' as const, whopPlanId: 'plan_LHuMredoSf6M1',
    membershipId: 'mem_1', status: 'active', cancelAtPeriodEnd: false, interval: 'monthly' as const,
    occurredAt: '2026-11-20T21:00:00.000Z',
  }
  test('activation keeps the existing event names', () => {
    const events = buildMembershipEvents({ ...base, type: 'membership.activated' })
    assert.deepEqual(events.map((e) => e.event), ['subscription_activated', 'subscription_started'])
  })
  test('deactivation adds subscription_canceled', () => {
    const events = buildMembershipEvents({ ...base, type: 'membership.deactivated', status: 'expired' })
    assert.deepEqual(events.map((e) => e.event), ['subscription_updated', 'subscription_canceled'])
  })
  test('cancel at period end on/off', () => {
    const on = buildMembershipEvents({ ...base, type: 'membership.cancel_at_period_end_changed', cancelAtPeriodEnd: true })
    const off = buildMembershipEvents({ ...base, type: 'membership.cancel_at_period_end_changed', cancelAtPeriodEnd: false })
    assert.equal(on[1].event, 'subscription_cancel_scheduled')
    assert.equal(off[1].event, 'subscription_cancel_reverted')
  })
  test('uuids are stable per webhook event', () => {
    const a = buildMembershipEvents({ ...base, type: 'membership.activated' })
    const b = buildMembershipEvents({ ...base, type: 'membership.activated' })
    assert.deepEqual(a.map((e) => e.uuid), b.map((e) => e.uuid))
    assert.notEqual(a[0].uuid, a[1].uuid)
  })
})

describe('resolvePurchaseIdentity', () => {
  test('uses payment metadata without a lookup', async () => {
    let called = false
    const id = await resolvePurchaseIdentity(
      { metadataUserId: 'u1', metadataPlanId: 'premium', configuredPlanId: null, membershipId: 'mem_1' },
      async () => { called = true; return null }
    )
    assert.deepEqual(id, { userId: 'u1', appPlanId: 'premium' })
    assert.equal(called, false)
  })
  test('falls back to the subscription row for renewals without metadata', async () => {
    const id = await resolvePurchaseIdentity(
      { metadataUserId: null, metadataPlanId: null, configuredPlanId: null, membershipId: 'mem_1' },
      async (m) => (m === 'mem_1' ? { user_id: 'u2', plan_id: 'premium' } : null)
    )
    assert.deepEqual(id, { userId: 'u2', appPlanId: 'premium' })
  })
  test('returns no user when nothing matches', async () => {
    const id = await resolvePurchaseIdentity(
      { metadataUserId: null, metadataPlanId: null, configuredPlanId: 'core', membershipId: null },
      async () => null
    )
    assert.deepEqual(id, { userId: null, appPlanId: 'core' })
  })
})

describe('sendServerEvents', () => {
  const event: ServerAnalyticsEvent = { distinctId: 'u', event: 'purchase_completed', properties: {}, uuid: 'x' }

  test('captures every event and flushes', async () => {
    const captured: string[] = []
    let flushed = 0
    const client: CaptureClient = {
      capture: (e) => { captured.push(e.event) },
      shutdown: async (ms) => { flushed = ms ?? -1 },
    }
    const ok = await sendServerEvents([event, { ...event, event: 'subscription_renewed' }], () => client, { logger: silent })
    assert.equal(ok, true)
    assert.deepEqual(captured, ['purchase_completed', 'subscription_renewed'])
    assert.equal(flushed, 3000)
  })

  test('never throws when the client, capture or flush fails', async () => {
    assert.equal(await sendServerEvents([event], () => { throw new Error('boom') }, { logger: silent }), false)
    let flushed = false
    assert.equal(await sendServerEvents([event], () => ({
      capture: () => { throw new Error('capture') },
      shutdown: async () => { flushed = true },
    }), { logger: silent }), true)
    assert.equal(flushed, true)
    assert.equal(await sendServerEvents([event], () => ({
      capture: () => {},
      shutdown: async () => { throw new Error('network') },
    }), { logger: silent }), false)
  })

  test('skips when no key is configured', async () => {
    assert.equal(await sendServerEvents([event], () => null, { logger: silent }), false)
  })
})
