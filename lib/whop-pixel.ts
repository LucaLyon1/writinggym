declare global {
  interface Window {
    whop?: {
      track: (
        event: string,
        data?: { value?: number; currency?: string },
      ) => void
    }
  }
}

export type WhopConversionEvent =
  | 'lead'
  | 'complete_registration'
  | 'add_to_cart'

export function trackWhopEvent(event: WhopConversionEvent) {
  window.whop?.track(event)
}
