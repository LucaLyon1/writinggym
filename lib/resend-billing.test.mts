import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  DEFAULT_RESEND_PAYING_SEGMENT_ID,
  getResendPlanTierForBillingStatus,
  RESEND_FREE_PLAN_TIER,
  RESEND_PAID_PLAN_TIER,
  syncResendBillingContact,
  type ResendBillingClient,
} from './resend-billing.ts'

function ok<T>(data: T) {
  return { data, error: null }
}

function err(partial: { message: string; name?: string; statusCode?: number | null }) {
  return {
    data: null,
    error: {
      message: partial.message,
      name: partial.name ?? 'application_error',
      statusCode: partial.statusCode ?? 500,
    },
  }
}

describe('getResendPlanTierForBillingStatus', () => {
  test('maps active core to plan_tier core', () => {
    assert.equal(getResendPlanTierForBillingStatus('active', 'core'), 'core')
  })

  test('maps trialing premium to plan_tier premium', () => {
    assert.equal(getResendPlanTierForBillingStatus('trialing', 'premium'), 'premium')
  })

  test('preserves pre_release_yearly and other paid app plan_ids', () => {
    assert.equal(
      getResendPlanTierForBillingStatus('active', 'pre_release_yearly'),
      'pre_release_yearly'
    )
  })

  test('falls back to core when paid status has no plan_id', () => {
    assert.equal(getResendPlanTierForBillingStatus(' ACTIVE '), RESEND_PAID_PLAN_TIER)
  })

  for (const status of ['canceled', 'expired', 'incomplete_expired', 'unpaid']) {
    test(`maps ${status} back to the free plan tier`, () => {
      assert.equal(getResendPlanTierForBillingStatus(status, 'premium'), RESEND_FREE_PLAN_TIER)
    })
  }

  for (const status of ['past_due', 'canceling', 'paused', 'incomplete', 'unknown']) {
    test(`does not change Resend for transitional status ${status}`, () => {
      assert.equal(getResendPlanTierForBillingStatus(status, 'premium'), null)
    })
  }
})

describe('syncResendBillingContact', () => {
  test('updates plan_tier from app plan_id and adds Paying Users for active', async () => {
    const calls: unknown[] = []
    const client: ResendBillingClient = {
      contacts: {
        async create() {
          throw new Error('create should not be called')
        },
        async update(input) {
          calls.push(['update', input])
          return ok({ id: 'contact_1' })
        },
        segments: {
          async add(input) {
            calls.push(['add', input])
            return ok({ id: DEFAULT_RESEND_PAYING_SEGMENT_ID })
          },
          async remove() {
            throw new Error('remove should not be called')
          },
        },
      },
    }

    const result = await syncResendBillingContact(
      {
        email: ' Writer@Example.com ',
        status: 'active',
        planId: 'premium',
      },
      client
    )

    assert.deepEqual(result, { outcome: 'updated', planTier: 'premium' })
    assert.deepEqual(calls, [
      ['update', {
        email: 'writer@example.com',
        properties: { plan_tier: 'premium' },
      }],
      ['add', {
        email: 'writer@example.com',
        segmentId: DEFAULT_RESEND_PAYING_SEGMENT_ID,
      }],
    ])
  })

  test('updates plan_tier and removes the Paying Users segment on cancel', async () => {
    const calls: unknown[] = []
    const client: ResendBillingClient = {
      contacts: {
        async create() {
          throw new Error('create should not be called')
        },
        async update(input) {
          calls.push(['update', input])
          return ok({ id: 'contact_1' })
        },
        segments: {
          async add() {
            throw new Error('add should not be called')
          },
          async remove(input) {
            calls.push(['remove', input])
            return ok({ id: DEFAULT_RESEND_PAYING_SEGMENT_ID, deleted: true })
          },
        },
      },
    }

    const result = await syncResendBillingContact(
      {
        email: 'writer@example.com',
        status: 'canceled',
        planId: 'premium',
      },
      client
    )

    assert.deepEqual(result, { outcome: 'updated', planTier: RESEND_FREE_PLAN_TIER })
    assert.deepEqual(calls, [
      ['update', {
        email: 'writer@example.com',
        properties: { plan_tier: RESEND_FREE_PLAN_TIER },
      }],
      ['remove', {
        email: 'writer@example.com',
        segmentId: DEFAULT_RESEND_PAYING_SEGMENT_ID,
      }],
    ])
  })

  test('creates a missing contact with preserved plan_id and Paying Users when paid', async () => {
    const calls: unknown[] = []
    const client: ResendBillingClient = {
      contacts: {
        async create(input) {
          calls.push(['create', input])
          return ok({ id: 'contact_new' })
        },
        async update(input) {
          calls.push(['update', input])
          return err({
            message: 'Contact not found',
            name: 'not_found',
            statusCode: 404,
          })
        },
        segments: {
          async add() {
            throw new Error('add should not be called after create with segments')
          },
          async remove() {
            throw new Error('remove should not be called')
          },
        },
      },
    }

    const result = await syncResendBillingContact(
      {
        email: 'writer@example.com',
        status: 'trialing',
        planId: 'pre_release_yearly',
      },
      client
    )

    assert.deepEqual(result, { outcome: 'created', planTier: 'pre_release_yearly' })
    assert.deepEqual(calls, [
      ['update', {
        email: 'writer@example.com',
        properties: { plan_tier: 'pre_release_yearly' },
      }],
      ['create', {
        email: 'writer@example.com',
        properties: { plan_tier: 'pre_release_yearly' },
        segments: [{ id: DEFAULT_RESEND_PAYING_SEGMENT_ID }],
      }],
    ])
  })

  test('treats already-in-segment and not-in-segment errors as success', async () => {
    const paidClient: ResendBillingClient = {
      contacts: {
        async create() {
          throw new Error('create should not be called')
        },
        async update() {
          return ok({ id: 'contact_1' })
        },
        segments: {
          async add() {
            return err({
              message: 'Contact is already in segment',
              name: 'validation_error',
              statusCode: 422,
            })
          },
          async remove() {
            throw new Error('remove should not be called')
          },
        },
      },
    }

    assert.deepEqual(
      await syncResendBillingContact(
        { email: 'writer@example.com', status: 'active', planId: 'core' },
        paidClient
      ),
      { outcome: 'updated', planTier: 'core' }
    )

    const freeClient: ResendBillingClient = {
      contacts: {
        async create() {
          throw new Error('create should not be called')
        },
        async update() {
          return ok({ id: 'contact_1' })
        },
        segments: {
          async add() {
            throw new Error('add should not be called')
          },
          async remove() {
            return err({
              message: 'Contact is not in segment',
              name: 'not_found',
              statusCode: 404,
            })
          },
        },
      },
    }

    assert.deepEqual(
      await syncResendBillingContact(
        { email: 'writer@example.com', status: 'expired', planId: 'core' },
        freeClient
      ),
      { outcome: 'updated', planTier: RESEND_FREE_PLAN_TIER }
    )
  })

  test('does not call Resend for a temporary payment problem', async () => {
    let called = false
    const client: ResendBillingClient = {
      contacts: {
        async create() {
          called = true
          return ok({ id: 'contact_1' })
        },
        async update() {
          called = true
          return ok({ id: 'contact_1' })
        },
        segments: {
          async add() {
            called = true
            return ok({ id: 'seg' })
          },
          async remove() {
            called = true
            return ok({ id: 'seg', deleted: true })
          },
        },
      },
    }

    const result = await syncResendBillingContact(
      {
        email: 'writer@example.com',
        status: 'past_due',
        planId: 'premium',
      },
      client
    )

    assert.deepEqual(result, { outcome: 'unchanged' })
    assert.equal(called, false)
  })

  test('propagates Resend failures so webhook providers can retry', async () => {
    const client: ResendBillingClient = {
      contacts: {
        async create() {
          throw new Error('create should not be called')
        },
        async update() {
          return err({ message: 'Resend unavailable', name: 'application_error', statusCode: 503 })
        },
        segments: {
          async add() {
            throw new Error('add should not be called')
          },
          async remove() {
            throw new Error('remove should not be called')
          },
        },
      },
    }

    await assert.rejects(
      syncResendBillingContact(
        {
          email: 'writer@example.com',
          status: 'active',
          planId: 'core',
        },
        client
      ),
      /Resend unavailable/
    )
  })
})
