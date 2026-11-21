import { PostHog } from 'posthog-node'
import {
  sendServerEvents,
  type CaptureClient,
  type ServerAnalyticsEvent,
} from '@/lib/billing-analytics'

function posthogKey(): string | undefined {
  return process.env.NEXT_PUBLIC_POSTHOG_KEY || undefined
}

function posthogHost(): string {
  return process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'
}

export function getPostHogClient(): PostHog {
  return new PostHog(posthogKey()!, {
    host: posthogHost(),
    flushAt: 1,
    flushInterval: 0,
  })
}

/**
 * Capture server-side events and flush them before the serverless function
 * returns. Never throws, and skips quietly when no PostHog key is configured.
 */
export async function captureServerEvents(events: ServerAnalyticsEvent[]): Promise<boolean> {
  return sendServerEvents(events, () => {
    if (!posthogKey()) return null
    const client = getPostHogClient()
    return {
      capture: (event) => client.capture(event),
      shutdown: (timeoutMs) => client.shutdown(timeoutMs),
    } satisfies CaptureClient
  })
}
