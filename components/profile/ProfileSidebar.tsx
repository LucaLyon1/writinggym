'use client'

import { useEffect, useState, type ReactNode } from 'react'

export function ProfileSidebar({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth
    const previousOverflow = document.body.style.overflow
    const previousPadding = document.body.style.paddingRight
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.paddingRight = previousPadding
    }
  }, [open])

  return (
    <div className={`profile-sidebar-wrap${open ? ' sidebar-open' : ''}`}>
      <button
        type="button"
        className="browser-sidebar-toggle"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <span aria-hidden="true">☰</span> Menu
      </button>
      <div
        className="browser-sidebar-backdrop"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <nav className="browser-sidebar">
        {children}
      </nav>
    </div>
  )
}
