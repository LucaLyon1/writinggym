'use client'

import { useSidebar } from './SidebarContext'

export function MobileSidebarToggle() {
  const { open, toggle } = useSidebar()

  return (
    <button
      type="button"
      className={`mobile-sidebar-toggle${open ? ' is-open' : ''}`}
      onClick={toggle}
      aria-label={open ? 'Close navigation' : 'Open navigation'}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ overflow: 'visible' }}>
        <line className="toggle-line toggle-line-1" x1="4" y1="5.5" x2="16" y2="5.5" />
        <line className="toggle-line toggle-line-2" x1="4" y1="10" x2="16" y2="10" />
        <line className="toggle-line toggle-line-3" x1="4" y1="14.5" x2="16" y2="14.5" />
      </svg>
    </button>
  )
}
