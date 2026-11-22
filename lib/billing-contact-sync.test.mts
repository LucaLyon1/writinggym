import assert from 'node:assert/strict'
import { before, describe, mock, test } from 'node:test'

process.env.SUPABASE_URL ??= 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test-service-role-key'

const { syncBillingContactForUser } = await import('./billing-contact-sync.ts')

const USER = {
  email: 'writer@example.com',
  status: 'active',
  userId: 'user_1',
  planId: 'premium',
} as const

function userLookup(email: string | null, error: { message: string } | null = null) {
  return async () => ({
    data: { user: email ? { email } : null },
    error,
  })
}

describe('syncBillingContactForUser', () => {
  before(() => {
    mock.method(console, 'error', () => {})
  })

  test('syncs Loops and Resend and returns both results', async () => {
    const loopsCalls: unknown[] = []
    const resendCalls: unknown[] = []

    const result = await syncBillingContactForUser(
      {
        status: USER.status,
        userId: USER.userId,
        planId: USER.planId,
      },
      {
        getUserById: userLookup(USER.email),
        async syncLoops(input) {
          loopsCalls.push(input)
          return { outcome: 'updated', userGroup: 'Core User' }
        },
        async syncResend(input) {
          resendCalls.push(input)
          return { outcome: 'updated', planTier: 'premium' }
        },
      }
    )

    assert.deepEqual(result, {
      loops: { outcome: 'updated', userGroup: 'Core User' },
      resend: { outcome: 'updated', planTier: 'premium' },
    })
    assert.deepEqual(loopsCalls, [{
      email: USER.email,
      status: USER.status,
      userId: USER.userId,
    }])
    assert.deepEqual(resendCalls, [{
      email: USER.email,
      status: USER.status,
      planId: USER.planId,
    }])
  })

  test('logs a Loops failure and still syncs Resend without throwing', async () => {
    const errors: unknown[] = []
    const restore = mock.method(console, 'error', (...args: unknown[]) => {
      errors.push(args)
    })
    let resendCalled = false

    const result = await syncBillingContactForUser(
      {
        status: USER.status,
        userId: USER.userId,
        planId: USER.planId,
      },
      {
        getUserById: userLookup(USER.email),
        async syncLoops() {
          throw new Error('Loops unavailable')
        },
        async syncResend() {
          resendCalled = true
          return { outcome: 'updated', planTier: 'premium' }
        },
      }
    )

    restore.mock.restore()

    assert.equal(resendCalled, true)
    assert.deepEqual(result, {
      loops: { outcome: 'failed', error: 'Loops unavailable' },
      resend: { outcome: 'updated', planTier: 'premium' },
    })
    assert.equal(
      errors.some((args) =>
        Array.isArray(args) && String(args[0]).includes('Loops sync failed')
      ),
      true
    )
  })

  test('logs a Resend failure and still syncs Loops without throwing', async () => {
    let loopsCalled = false

    const result = await syncBillingContactForUser(
      {
        status: USER.status,
        userId: USER.userId,
        planId: USER.planId,
      },
      {
        getUserById: userLookup(USER.email),
        async syncLoops() {
          loopsCalled = true
          return { outcome: 'updated', userGroup: 'Core User' }
        },
        async syncResend() {
          throw new Error('Resend unavailable')
        },
      }
    )

    assert.equal(loopsCalled, true)
    assert.deepEqual(result, {
      loops: { outcome: 'updated', userGroup: 'Core User' },
      resend: { outcome: 'failed', error: 'Resend unavailable' },
    })
  })

  test('does not throw when both contact providers fail', async () => {
    const result = await syncBillingContactForUser(
      {
        status: USER.status,
        userId: USER.userId,
        planId: USER.planId,
      },
      {
        getUserById: userLookup(USER.email),
        async syncLoops() {
          throw new Error('Loops unavailable')
        },
        async syncResend() {
          throw new Error('Resend unavailable')
        },
      }
    )

    assert.deepEqual(result, {
      loops: { outcome: 'failed', error: 'Loops unavailable' },
      resend: { outcome: 'failed', error: 'Resend unavailable' },
    })
  })

  test('does not throw when the billing contact has no email', async () => {
    const result = await syncBillingContactForUser(
      {
        status: USER.status,
        userId: USER.userId,
        planId: USER.planId,
      },
      {
        getUserById: userLookup(null),
        async syncLoops() {
          throw new Error('Loops should not be called')
        },
        async syncResend() {
          throw new Error('Resend should not be called')
        },
      }
    )

    assert.deepEqual(result, {
      loops: { outcome: 'failed', error: `Billing contact ${USER.userId} has no email address` },
      resend: { outcome: 'failed', error: `Billing contact ${USER.userId} has no email address` },
    })
  })
})
