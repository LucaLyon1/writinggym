'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * Root layout reads subscription before this page’s server work finishes, so
 * isFreeUser can stay stale until the RSC tree is refetched. One refresh after
 * hydration picks up the new row without a full browser reload.
 */
export function RefreshLayoutAfterPurchase({
  whopReceiptId,
}: {
  whopReceiptId?: string
}) {
  const router = useRouter()
  const didRun = useRef(false)

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true
    if (!whopReceiptId) {
      router.refresh()
      return
    }

    let canceled = false

    async function reconcilePurchase() {
      const delays = [0, 1000, 2000, 4000, 8000]

      for (const delay of delays) {
        if (delay) await new Promise((resolve) => setTimeout(resolve, delay))
        if (canceled) return

        try {
          const response = await fetch('/api/whop/sync-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ receiptId: whopReceiptId }),
          })

          if (response.ok) {
            router.refresh()
            return
          }

          // A completed payment can briefly precede membership availability.
          if (response.status !== 409 && response.status < 500) return
        } catch {
          // Retry transient network failures using the same verified receipt.
        }
      }

      router.refresh()
    }

    reconcilePurchase()
    return () => { canceled = true }
  }, [router, whopReceiptId])

  return null
}
