'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    $crisp?: unknown[]
    CRISP_WEBSITE_ID?: string
  }
}

const CRISP_WEBSITE_ID = '01cc6d23-4f53-413f-b359-f8d278bfbca7'

export function CrispChat() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (document.getElementById('crisp-loader')) return

    window.$crisp = []
    window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID

    const script = document.createElement('script')
    script.id = 'crisp-loader'
    script.src = 'https://client.crisp.chat/l.js'
    script.async = true
    document.head.appendChild(script)
  }, [])

  return null
}
