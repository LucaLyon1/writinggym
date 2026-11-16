import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NEW_AUTH_USER_WINDOW_MS, isNewlyCreatedAuthUser } from './auth-new-user.ts'

const now = new Date('2026-11-16T12:00:00.000Z')

function createdAt(offsetMs: number): string {
  return new Date(now.getTime() + offsetMs).toISOString()
}

test('treats a user created just now as new', () => {
  assert.equal(isNewlyCreatedAuthUser(createdAt(0), now), true)
})

test('treats a user created within the 10-minute window as new', () => {
  assert.equal(isNewlyCreatedAuthUser(createdAt(-NEW_AUTH_USER_WINDOW_MS + 1), now), true)
})

test('treats a user created exactly 10 minutes ago as new', () => {
  assert.equal(isNewlyCreatedAuthUser(createdAt(-NEW_AUTH_USER_WINDOW_MS), now), true)
})

test('does not treat a user created just over 10 minutes ago as new', () => {
  assert.equal(isNewlyCreatedAuthUser(createdAt(-NEW_AUTH_USER_WINDOW_MS - 1), now), false)
})

test('does not treat an older account as new', () => {
  assert.equal(isNewlyCreatedAuthUser(createdAt(-24 * 60 * 60 * 1000), now), false)
})

test('allows up to one minute of clock skew into the future', () => {
  assert.equal(isNewlyCreatedAuthUser(createdAt(60 * 1000), now), true)
  assert.equal(isNewlyCreatedAuthUser(createdAt(60 * 1000 + 1), now), false)
})

test('does not treat a missing created_at as new', () => {
  assert.equal(isNewlyCreatedAuthUser(undefined, now), false)
  assert.equal(isNewlyCreatedAuthUser(null, now), false)
  assert.equal(isNewlyCreatedAuthUser('', now), false)
})

test('does not treat an invalid created_at as new', () => {
  assert.equal(isNewlyCreatedAuthUser('not-a-date', now), false)
})
