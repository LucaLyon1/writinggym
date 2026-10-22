'use client'

import { useEffect, useRef } from 'react'
import { trackWhopEvent } from '@/lib/whop-pixel'

/** Fires Whop's standard `view_content` once per mount of a key page. */
export function WhopViewContent() {
  const tracked = useRef(false)
  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    trackWhopEvent('view_content')
  }, [])
  return null
}
