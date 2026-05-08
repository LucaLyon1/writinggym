'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * Root layout reads subscription before this page’s server work finishes, so
 * isFreeUser can stay stale until the RSC tree is refetched. One refresh after
 * hydration picks up the new row without a full browser reload.
 */
export function RefreshLayoutAfterPurchase() {
  const router = useRouter()
  const didRun = useRef(false)

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true
    router.refresh()
  }, [router])

  return null
}
