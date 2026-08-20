'use client'

import { useEffect } from 'react'
import { trackWhopEvent } from '@/lib/whop-pixel'

const REGISTRATION_PARAM = 'whop_registration'

export function WhopRegistrationTracker() {
  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get(REGISTRATION_PARAM) !== '1') return

    trackWhopEvent('complete_registration')
    url.searchParams.delete(REGISTRATION_PARAM)
    window.history.replaceState(
      window.history.state,
      '',
      `${url.pathname}${url.search}${url.hash}`,
    )
  }, [])

  return null
}
