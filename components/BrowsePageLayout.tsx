'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { SidebarNav } from '@/components/AppSidebar'

interface BrowsePageLayoutProps {
  children: ReactNode
  rightColumn?: ReactNode
}

export function BrowsePageLayout({ children, rightColumn }: BrowsePageLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!sidebarOpen) return
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
  }, [sidebarOpen])

  return (
    <div className="home-gallery-shell">
      <div className="home-gallery-main">
        <div className="browser-root browser-embedded">
          <div className={`browser-body browse-page-body${rightColumn ? ' has-right-col' : ''} ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <button
              type="button"
              className="browser-sidebar-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <span aria-hidden="true">☰</span> Menu
            </button>
            <div
              className="browser-sidebar-backdrop"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <nav className="browser-sidebar">
              <SidebarNav />
            </nav>
            <main className="browser-main browse-page-main">
              {children}
            </main>
            {rightColumn && (
              <aside className="browse-page-right">
                {rightColumn}
              </aside>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
