import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  getLoopsUserGroupForBillingStatus,
  LOOPS_FREE_USER_GROUP,
  LOOPS_PAID_USER_GROUP,
  syncLoopsBillingContact,
} from './loops-billing.ts'

describe('getLoopsUserGroupForBillingStatus', () => {
  for (const status of ['active', 'trialing', ' ACTIVE ']) {
    test(`maps ${status} to the paid purchase sequence`, () => {
      assert.equal(getLoopsUserGroupForBillingStatus(status), LOOPS_PAID_USER_GROUP)
    })
  }

  for (const status of ['canceled', 'expired', 'incomplete_expired', 'unpaid']) {
    test(`maps ${status} back to the free sequence`, () => {
      assert.equal(getLoopsUserGroupForBillingStatus(status), LOOPS_FREE_USER_GROUP)
    })
  }

  for (const status of ['past_due', 'canceling', 'paused', 'incomplete', 'unknown']) {
    test(`does not change Loops for transitional status ${status}`, () => {
      assert.equal(getLoopsUserGroupForBillingStatus(status), null)
    })
  }
})

describe('syncLoopsBillingContact', () => {
  test('upserts the stable user ID, current email, and paid group', async () => {
    const calls: unknown[] = []
    const client = {
      async updateContact(input: unknown) {
        calls.push(input)
        return { success: true as const, id: 'contact_1' }
      },
    }

    const result = await syncLoopsBillingContact(
      {
        email: 'writer@example.com',
        status: 'active',
        userId: 'user_1',
      },
      client
    )

    assert.deepEqual(result, { outcome: 'updated', userGroup: LOOPS_PAID_USER_GROUP })
    assert.deepEqual(calls, [{
      email: 'writer@example.com',
      userId: 'user_1',
      properties: { userGroup: LOOPS_PAID_USER_GROUP },
    }])
  })

  test('does not call Loops for a temporary payment problem', async () => {
    let called = false
    const client = {
      async updateContact() {
        called = true
        return { success: true as const, id: 'contact_1' }
      },
    }

    const result = await syncLoopsBillingContact(
      {
        email: 'writer@example.com',
        status: 'past_due',
        userId: 'user_1',
      },
      client
    )

    assert.deepEqual(result, { outcome: 'unchanged' })
    assert.equal(called, false)
  })

  test('propagates Loops failures so webhook providers can retry', async () => {
    const client = {
      async updateContact(): Promise<never> {
        throw new Error('Loops unavailable')
      },
    }

    await assert.rejects(
      syncLoopsBillingContact(
        {
          email: 'writer@example.com',
          status: 'active',
          userId: 'user_1',
        },
        client
      ),
      /Loops unavailable/
    )
  })
})
