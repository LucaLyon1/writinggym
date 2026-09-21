import posthog from 'posthog-js'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: '/ingest',
  ui_host: 'https://eu.posthog.com',
  defaults: '2026-01-30',
  capture_exceptions: true,
  debug: process.env.NODE_ENV === 'development',
  before_send: (event) => {
    if (event?.event !== '$exception') return event
    const values = event.properties?.['$exception_values']
    const list = Array.isArray(values) ? values : values != null ? [values] : []
    const isNextControlFlow = list.some(
      (v) =>
        typeof v === 'string' &&
        (v.includes('NEXT_REDIRECT') ||
          v.includes('NEXT_NOT_FOUND') ||
          v.includes('NEXT_HTTP_ERROR_FALLBACK')),
    )
    if (isNextControlFlow) return null
    return event
  },
})