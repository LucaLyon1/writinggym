import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  normaliseEmail,
  whopLeadEventId,
  whopRegistrationEventId,
} from './whop-pixel.ts'

describe('whop pixel event ids', () => {
  test('lead id is stable for the same email regardless of case and whitespace', async () => {
    const a = await whopLeadEventId('Jane@Example.com ')
    const b = await whopLeadEventId('jane@example.com')
    assert.equal(a, b)
    assert.match(a, /^lead_[0-9a-f]{32}$/)
  })

  test('lead id differs between people and does not contain the email', async () => {
    const a = await whopLeadEventId('jane@example.com')
    const b = await whopLeadEventId('john@example.com')
    assert.notEqual(a, b)
    assert.ok(!a.includes('example'))
  })

  test('lead id matches the SHA-256 of the normalised email', async () => {
    const { createHash } = await import('node:crypto')
    const hex = createHash('sha256').update('jane@example.com').digest('hex')
    assert.equal(await whopLeadEventId('jane@example.com'), `lead_${hex.slice(0, 32)}`)
  })

  test('registration id is one per account', () => {
    assert.equal(whopRegistrationEventId('user-1'), 'registration_user-1')
  })

  test('normaliseEmail trims and lower-cases', () => {
    assert.equal(normaliseEmail('  A@B.CO '), 'a@b.co')
  })
})
