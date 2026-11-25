'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * Whether to show the streak badge beside the profile name. Kept in this
 * browser for now (the profile is only visible to its owner); move it to the
 * profiles table once public profiles ship.
 */
const KEY = 'proselab:show-streak-badge'
const EVENT = 'proselab:streak-badge-pref'

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

function read(): boolean {
  try {
    return window.localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

export function useShowStreakBadge(): [boolean, (next: boolean) => void] {
  // Server render assumes "on" so the badge doesn't pop in for the common case.
  const show = useSyncExternalStore(subscribe, read, () => true)
  const setShow = useCallback((next: boolean) => {
    try {
      window.localStorage.setItem(KEY, next ? 'on' : 'off')
    } catch {
      // Storage unavailable (private mode): the toggle just won't persist.
    }
    window.dispatchEvent(new Event(EVENT))
  }, [])
  return [show, setShow]
}
