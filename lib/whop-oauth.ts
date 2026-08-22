import { Whop } from '@whop/sdk'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { WHOP_ACCOUNT_ID } from '@/lib/whop'

const TOKEN_URL = 'https://api.whop.com/oauth/token'
const AUTHORIZE_URL = 'https://api.whop.com/oauth/authorize'

export function getWhopOAuthClientId() {
  return process.env.WHOP_OAUTH_CLIENT_ID ?? process.env.NEXT_PUBLIC_WHOP_APP_ID ?? ''
}

export function getWhopOAuthRedirectUri(origin?: string) {
  if (process.env.WHOP_OAUTH_REDIRECT_URI) return process.env.WHOP_OAUTH_REDIRECT_URI
  const site =
    origin ??
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000'
  return `${site.replace(/\/$/, '')}/checkout/complete`
}

export function getWhopConnectRedirectUri(origin?: string) {
  const site =
    origin ??
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000'
  return `${site.replace(/\/$/, '')}/api/whop/oauth/callback`
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
}

async function saveTokens(userId: string, tokens: TokenResponse, existingRefresh?: string) {
  const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString()
  const refresh = tokens.refresh_token ?? existingRefresh
  if (!refresh) throw new Error('Whop OAuth response is missing a refresh token')

  let whopUserId: string | null = null
  try {
    const info = await fetch('https://api.whop.com/oauth/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    if (info.ok) {
      const body = (await info.json()) as { sub?: string }
      whopUserId = body.sub ?? null
    }
  } catch {
    whopUserId = null
  }

  const { error } = await supabaseAdmin.from('whop_oauth_tokens').upsert({
    user_id: userId,
    access_token: tokens.access_token,
    refresh_token: refresh,
    expires_at: expiresAt,
    whop_user_id: whopUserId,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
  return tokens.access_token
}

export async function exchangeWhopOAuthCode(input: {
  userId: string
  code: string
  redirectUri: string
  codeVerifier?: string
}) {
  const clientId = getWhopOAuthClientId()
  const clientSecret = process.env.WHOP_OAUTH_CLIENT_SECRET
  if (!clientId) throw new Error('WHOP_OAUTH_CLIENT_ID is not configured')

  const body: Record<string, string> = {
    grant_type: 'authorization_code',
    code: input.code,
    redirect_uri: input.redirectUri,
    client_id: clientId,
  }
  if (input.codeVerifier) body.code_verifier = input.codeVerifier
  if (clientSecret) body.client_secret = clientSecret

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = (await res.json().catch(() => ({}))) as TokenResponse & {
    error?: string
    error_description?: string
  }
  if (!res.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || 'Whop OAuth exchange failed')
  }
  return saveTokens(input.userId, payload)
}

export async function getValidWhopUserAccessToken(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('whop_oauth_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (!data) return null

  const stillValid = new Date(data.expires_at).getTime() - Date.now() > 5 * 60 * 1000
  if (stillValid) return data.access_token

  const clientId = getWhopOAuthClientId()
  if (!clientId) return null

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: data.refresh_token,
      client_id: clientId,
      ...(process.env.WHOP_OAUTH_CLIENT_SECRET
        ? { client_secret: process.env.WHOP_OAUTH_CLIENT_SECRET }
        : {}),
    }),
  })
  const payload = (await res.json().catch(() => ({}))) as TokenResponse & { error?: string }
  if (!res.ok || !payload.access_token) return null
  return saveTokens(userId, payload, data.refresh_token)
}

export function buildWhopAuthorizeUrl(input: {
  redirectUri: string
  state: string
  codeChallenge: string
}) {
  const clientId = getWhopOAuthClientId()
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: input.redirectUri,
    scope: 'openid profile email forum:read forum:post:create chat:read chat:message:create',
    state: input.state,
    code_challenge: input.codeChallenge,
    code_challenge_method: 'S256',
    company_id: WHOP_ACCOUNT_ID,
  })
  return `${AUTHORIZE_URL}?${params}`
}

export function whopClientFromUserToken(accessToken: string) {
  return new Whop({ apiKey: accessToken, version: '2026-08-13' })
}
