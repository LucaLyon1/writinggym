import '../scripts/test-next.mts'
import assert from 'node:assert/strict'
import { afterEach, beforeEach, mock, test } from 'node:test'
import { NextRequest } from 'next/server'
import { middleware, config } from '../middleware.ts'
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server'

const envNames = ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] as const
const savedEnv = new Map(envNames.map(name => [name, process.env[name]]))

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key'
  mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network request') })
})
afterEach(() => {
  mock.restoreAll()
  for (const [name, value] of savedEnv) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
})

function authenticatedRequest(path: string, expiresAt = Math.floor(Date.now() / 1000) + 3600) {
  const session = {
    access_token: 'test-access-token', refresh_token: 'test-refresh-token',
    expires_at: expiresAt, expires_in: 3600, token_type: 'bearer',
    user: { id: 'test-user' },
  }
  const value = `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`
  return new NextRequest(`http://localhost${path}`, {
    headers: { cookie: `sb-project-auth-token=${value}` },
  })
}

test('protected pages redirect anonymous visitors and preserve the destination', async () => {
  const response = await middleware(new NextRequest('http://localhost/profile?tab=writing'))
  assert.equal(response.status, 307)
  const location = new URL(response.headers.get('location')!)
  assert.equal(location.pathname, '/signup')
  assert.equal(location.searchParams.get('next'), '/profile?tab=writing')
})

for (const path of ['/', '/pricing', '/auth/callback', '/api/stripe-webhook', '/api/whop-webhook']) {
  test(`${path} reaches its handler without a user session`, async () => {
    const response = await middleware(new NextRequest(`http://localhost${path}`))
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('location'), null)
  })
}

test('protected requests make one authenticated user lookup', async () => {
  const fetchMock = mock.method(globalThis, 'fetch', async () => Response.json({ id: 'test-user' }))
  const response = await middleware(authenticatedRequest('/profile'))
  assert.equal(response.status, 200)
  assert.equal(fetchMock.mock.callCount(), 1)
  assert.match(String(fetchMock.mock.calls[0].arguments[0]), /\/auth\/v1\/user$/)
})

test('invalid refreshed sessions clear browser cookies on the redirect', async () => {
  mock.method(console, 'error', () => {})
  mock.method(globalThis, 'fetch', async () => Response.json({
    code: 'refresh_token_not_found', message: 'Invalid Refresh Token: Refresh Token Not Found',
  }, { status: 400 }))
  const response = await middleware(authenticatedRequest('/profile', 1))
  assert.equal(response.status, 307)
  const cookie = response.cookies.get('sb-project-auth-token')
  assert.ok(cookie)
  assert.equal(cookie.value, '')
  assert.equal(cookie.maxAge, 0)
})

test('favicon files bypass authentication middleware', () => {
  for (const url of ['/favicon/favicon.ico', '/favicon/site.webmanifest', '/_next/static/app.js']) {
    assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url }), false)
  }
  assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: '/profile' }), true)
})
