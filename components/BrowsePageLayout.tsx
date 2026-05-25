'use client'

import { type ReactNode } from 'react'
import { SidebarNav } from '@/components/AppSidebar'
import { useSidebar } from '@/components/SidebarContext'

interface BrowsePageLayoutProps {
  children: ReactNode
  rightColumn?: ReactNode
}

export function BrowsePageLayout({ children, rightColumn }: BrowsePageLayoutProps) {
  const { open: sidebarOpen } = useSidebar()

  return (
    <div className="home-gallery-shell">
      <div className="home-gallery-main">
        <div className="browser-root browser-embedded">
          <div className={`browser-body browse-page-body${rightColumn ? ' has-right-col' : ''} ${sidebarOpen ? 'sidebar-open' : ''}`}>
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
