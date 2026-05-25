'use client'

import { useSidebar } from './SidebarContext'

export function SidebarBackdrop() {
  const { open, setOpen } = useSidebar()

  return (
    <div
      className={`global-sidebar-backdrop${open ? ' is-open' : ''}`}
      onClick={() => setOpen(false)}
      aria-hidden="true"
    />
  )
}
