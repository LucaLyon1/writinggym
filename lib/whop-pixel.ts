declare global {
  interface Window {
    whop?: {
      track: (
        event: string,
        data?: WhopTrackData,
      ) => void
    }
  }
}

/** Optional payload for Whop pixel events (customer info + dedupe). */
export type WhopTrackData = {
  value?: number
  currency?: string
  email?: string
  event_id?: string
  name?: string
  phone?: string
  external_id?: string
  first_name?: string
  last_name?: string
}

export type WhopConversionEvent =
  | 'lead'
  | 'complete_registration'
  | 'add_to_cart'

export function trackWhopEvent(
  event: WhopConversionEvent,
  data?: WhopTrackData,
) {
  if (typeof window === 'undefined') return
  if (data && Object.keys(data).length > 0) {
    window.whop?.track(event, data)
  } else {
    window.whop?.track(event)
  }
}
