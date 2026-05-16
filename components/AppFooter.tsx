'use client'

import { usePathname } from 'next/navigation'

const HIDDEN_ON: ReadonlySet<string> = new Set(['/login', '/signup'])

export function AppFooterAuto() {
  const pathname = usePathname()
  if (HIDDEN_ON.has(pathname)) return null
  return <AppFooter />
}

export function AppFooter() {
  return (
    <footer className="app-footer">
      <span>© 2026 ProseLab</span>
      <span aria-hidden>•</span>
      <a
        href="https://proselab.io/privacy"
        className="app-footer-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        Privacy
      </a>
      <span aria-hidden>•</span>
      <a
        href="https://proselab.io/terms"
        className="app-footer-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        Terms
      </a>
    </footer>
  )
}
