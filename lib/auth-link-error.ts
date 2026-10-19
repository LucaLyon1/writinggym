/**
 * Supabase sends people back to the Site URL with
 * `#error=access_denied&error_code=otp_expired&error_description=…` when an
 * email link has expired, has already been used, or was cancelled by a newer
 * link. These helpers detect that so the app can explain it instead of
 * silently landing people on the home page.
 */
export interface AuthLinkError {
  error: string
  errorCode: string | null
  errorDescription: string | null
  /** Where the error params were found in the URL. */
  location: 'hash' | 'search'
}

const AUTH_ERROR_PARAMS = ['error', 'error_code', 'error_description', 'sb'] as const

function fromParams(
  params: URLSearchParams,
  location: AuthLinkError['location']
): AuthLinkError | null {
  const error = params.get('error')
  // Require error_description so unrelated `?error=` params are left alone.
  if (!error || !params.has('error_description')) return null
  return {
    error,
    errorCode: params.get('error_code'),
    errorDescription: params.get('error_description'),
    location,
  }
}

export function parseAuthLinkError(url: URL): AuthLinkError | null {
  const hash = url.hash.replace(/^#/, '')
  return fromParams(new URLSearchParams(hash), 'hash') ?? fromParams(url.searchParams, 'search')
}

/** Path + query + hash for the same URL with the Supabase auth error params removed. */
export function stripAuthLinkError(url: URL): string {
  const err = parseAuthLinkError(url)
  const search = new URLSearchParams(url.searchParams)
  let hash = url.hash

  if (err?.location === 'search') {
    for (const key of AUTH_ERROR_PARAMS) search.delete(key)
  }
  if (err?.location === 'hash') {
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''))
    for (const key of AUTH_ERROR_PARAMS) hashParams.delete(key)
    const rest = hashParams.toString()
    hash = rest ? `#${rest}` : ''
  }

  const qs = search.toString()
  return `${url.pathname}${qs ? `?${qs}` : ''}${hash}`
}

export function authLinkErrorMessage(err: AuthLinkError): string {
  if (err.errorCode === 'otp_expired') {
    return 'That email link has expired or has already been used. Each link only works once, and requesting a new one cancels older ones, so send yourself a fresh link below and open the latest email.'
  }
  return 'We couldn\u2019t sign you in with that email link. Please send yourself a fresh link below.'
}
