import assert from 'node:assert/strict'
import { test } from 'node:test'
import { authLinkErrorMessage, parseAuthLinkError, stripAuthLinkError } from './auth-link-error.ts'

const expiredHash =
  'https://app.proselab.io/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired&sb='

test('parses the Supabase otp_expired hash', () => {
  const err = parseAuthLinkError(new URL(expiredHash))
  assert.deepEqual(err, {
    error: 'access_denied',
    errorCode: 'otp_expired',
    errorDescription: 'Email link is invalid or has expired',
    location: 'hash',
  })
  assert.match(authLinkErrorMessage(err!), /expired or has already been used/)
})

test('strips the error hash but keeps the path and query', () => {
  assert.equal(stripAuthLinkError(new URL(expiredHash)), '/')
  const withQuery = new URL('https://app.proselab.io/extract/x?tab=voice#error=access_denied&error_code=otp_expired&error_description=x&sb=')
  assert.equal(stripAuthLinkError(withQuery), '/extract/x?tab=voice')
})

test('handles errors sent in the query string', () => {
  const url = new URL('https://app.proselab.io/login?next=%2F&error=server_error&error_description=boom')
  const err = parseAuthLinkError(url)
  assert.equal(err?.location, 'search')
  assert.equal(err?.errorCode, null)
  assert.match(authLinkErrorMessage(err!), /couldn.t sign you in/)
  assert.equal(stripAuthLinkError(url), '/login?next=%2F')
})

test('ignores URLs without a Supabase auth error', () => {
  assert.equal(parseAuthLinkError(new URL('https://app.proselab.io/?welcome=1')), null)
  assert.equal(parseAuthLinkError(new URL('https://app.proselab.io/?error=1')), null)
  assert.equal(parseAuthLinkError(new URL('https://app.proselab.io/#section')), null)
  assert.equal(stripAuthLinkError(new URL('https://app.proselab.io/a?b=1#c')), '/a?b=1#c')
})
