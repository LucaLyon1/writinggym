'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import posthog from 'posthog-js'
import { useAuthModal } from './AuthModal'

const STORAGE_KEY = 'proselab-first-visit-modal-seen'

export function FirstVisitAuthModal() {
  const { open } = useAuthModal()
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (pathname !== '/') return
    if (sessionStorage.getItem(STORAGE_KEY)) return
    sessionStorage.setItem(STORAGE_KEY, '1')
    posthog.capture('first_visit_auth_modal_shown')
    open('signup', 'first_visit')
  }, [open, pathname])

  return null
}
