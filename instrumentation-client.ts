import posthog from 'posthog-js'

// Next.js throws these as control flow (redirect(), notFound(), etc.).
// They are not real errors, so keep them out of PostHog error tracking.
const NEXT_CONTROL_FLOW_MARKERS = [
  'NEXT_REDIRECT',
  'NEXT_NOT_FOUND',
  'NEXT_HTTP_ERROR_FALLBACK',
]

const isNextControlFlowText = (v: unknown) =>
  typeof v === 'string' && NEXT_CONTROL_FLOW_MARKERS.some((m) => v.includes(m))

const toArray = (v: unknown): unknown[] =>
  Array.isArray(v) ? v : v != null ? [v] : []

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: '/ingest',
  ui_host: 'https://eu.posthog.com',
  defaults: '2026-01-30',
  capture_exceptions: true,
  debug: process.env.NODE_ENV === 'development',
  before_send: (event) => {
    if (event?.event !== '$exception') return event
    const props = event.properties ?? {}
    // posthog-js sends `$exception_list` from the browser; `$exception_values`
    // is only derived later at ingestion, so checking it alone never matched.
    const texts: unknown[] = [
      ...toArray(props['$exception_list']).flatMap((e) =>
        e && typeof e === 'object'
          ? [(e as { value?: unknown }).value, (e as { type?: unknown }).type]
          : [],
      ),
      ...toArray(props['$exception_values']),
      props['$exception_message'],
    ]
    if (texts.some(isNextControlFlowText)) return null
    return event
  },
})
