import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { Webhook } from 'standardwebhooks'
import {
  handleWhopRefund,
  isFullyRefunded,
  isStaleReactivation,
  type RefundDeps,
  type SubscriptionFilter,
  type SubscriptionsTable,
  type WhopRefundPayment,
} from './whop-refund.ts'

type Row = {
  user_id: string
  plan_id: string
  status: string
  billing_provider: string
  external_subscription_id: string | null
  canceled_at: string | null
}

/** In-memory stand-in for supabase.from('subscriptions') applying real filters. */
function fakeTable(rows: Row[]): SubscriptionsTable {
  return {
    update(values) {
      const filters: Array<(r: Row) => boolean> = []
      const builder: SubscriptionFilter = {
        eq(col, val) {
          filters.push((r) => (r as Record<string, unknown>)[col] === val)
          return builder
        },
        in(col, vals) {
          filters.push((r) => vals.includes((r as Record<string, unknown>)[col] as string))
          return builder
        },
        select() {
          return {
            maybeSingle: async () => {
              const hits = rows.filter((r) => filters.every((f) => f(r)))
              for (const r of hits) Object.assign(r, values)
              const hit = hits[0]
              return { data: hit ? { user_id: hit.user_id, plan_id: hit.plan_id } : null, error: null }
            },
          }
        },
      }
      return builder
    },
  }
}

function seed(): Row[] {
  return [
    { user_id: 'u-whop', plan_id: 'core', status: 'active', billing_provider: 'whop', external_subscription_id: 'mem_1', canceled_at: null },
    { user_id: 'u-stripe', plan_id: 'premium', status: 'active', billing_provider: 'stripe', external_subscription_id: 'mem_1', canceled_at: null },
    { user_id: 'u-comp', plan_id: 'premium', status: 'active', billing_provider: 'stripe', external_subscription_id: null, canceled_at: null },
  ]
}

const fullPayment: WhopRefundPayment = {
  id: 'pay_1', substatus: 'refunded', total: 10, refunded_amount: 10,
  refunded_at: '2026-10-14T12:00:00.000Z', membership: { id: 'mem_1' },
}

function deps(rows: Row[], payment: WhopRefundPayment, revoked: string[] = []): RefundDeps {
  return {
    subscriptions: fakeTable(rows),
    retrievePayment: async () => payment,
    onRevoked: async ({ userId }) => { revoked.push(userId) },
  }
}

const refund = { id: 'rf_1', status: 'succeeded', payment: { id: 'pay_1' } }

describe('handleWhopRefund', () => {
  test('full refund revokes the matching whop row and sets canceled_at', async () => {
    const rows = seed(); const revoked: string[] = []
    const out = await handleWhopRefund(refund, deps(rows, fullPayment, revoked))
    assert.equal(out.action, 'revoked')
    assert.equal(rows[0].status, 'canceled')
    assert.equal(rows[0].canceled_at, '2026-10-14T12:00:00.000Z')
    assert.deepEqual(revoked, ['u-whop'])
  })

  test('stripe and comp rows are untouched', async () => {
    const rows = seed()
    await handleWhopRefund(refund, deps(rows, fullPayment))
    assert.equal(rows[1].status, 'active'); assert.equal(rows[1].canceled_at, null)
    assert.equal(rows[2].status, 'active'); assert.equal(rows[2].canceled_at, null)
  })

  test('duplicate refund (or refund after membership.deactivated) is a no-op', async () => {
    const rows = seed(); const revoked: string[] = []
    await handleWhopRefund(refund, deps(rows, fullPayment, revoked))
    const firstCanceledAt = rows[0].canceled_at
    const again = await handleWhopRefund({ ...refund, id: 'rf_1_updated' }, deps(rows, fullPayment, revoked))
    assert.equal(again.action, 'ignored')
    assert.equal(rows[0].canceled_at, firstCanceledAt)
    assert.deepEqual(revoked, ['u-whop'])

    const expired = seed(); expired[0].status = 'expired'
    const out = await handleWhopRefund(refund, deps(expired, fullPayment))
    assert.equal(out.action, 'ignored'); assert.equal(expired[0].status, 'expired')
  })

  test('partial refund leaves access in place', async () => {
    const rows = seed()
    const out = await handleWhopRefund(refund, deps(rows, {
      ...fullPayment, substatus: 'partially_refunded', refunded_amount: 4,
    }))
    assert.deepEqual(out, { action: 'ignored', reason: 'partial refund' })
    assert.equal(rows[0].status, 'active')
  })

  test('pending refund is ignored', async () => {
    const rows = seed()
    const out = await handleWhopRefund({ ...refund, status: 'pending' }, deps(rows, fullPayment))
    assert.equal(out.action, 'ignored'); assert.equal(rows[0].status, 'active')
  })
})

describe('isFullyRefunded', () => {
  test('falls back to amounts when substatus is absent', () => {
    assert.equal(isFullyRefunded({ id: 'p', total: 10, refunded_amount: 10 }), true)
    assert.equal(isFullyRefunded({ id: 'p', total: 10, refunded_amount: 3 }), false)
    assert.equal(isFullyRefunded({ id: 'p', total: null, refunded_amount: null }), false)
  })
})

describe('isStaleReactivation', () => {
  test('never lets a terminal row flip back to active', () => {
    assert.equal(isStaleReactivation('canceled', 'active'), true)
    assert.equal(isStaleReactivation('active', 'active'), false)
    assert.equal(isStaleReactivation('canceled', 'canceled'), false)
  })
})

describe('webhook signature (standardwebhooks, as lib/whop.ts)', () => {
  test('rejects a body signed with the wrong secret', () => {
    const body = JSON.stringify({ id: 'evt_1', type: 'refund.created' })
    const headers = { 'webhook-id': 'msg_1', 'webhook-timestamp': String(Math.floor(Date.now() / 1000)) }
    const sig = new Webhook('ws_wrong', { format: 'raw' }).sign('msg_1', new Date(), body)
    const wh = new Webhook('ws_right', { format: 'raw' })
    assert.throws(() => wh.verify(body, { ...headers, 'webhook-signature': sig }))
    const good = new Webhook('ws_right', { format: 'raw' }).sign('msg_1', new Date(), body)
    assert.doesNotThrow(() => wh.verify(body, { ...headers, 'webhook-signature': good }))
  })
})
