'use client'

import { type ReactNode } from 'react'
import { useSidebar } from '@/components/SidebarContext'

export function ProfileSidebar({ children }: { children: ReactNode }) {
  const { open } = useSidebar()

  return (
    <aside className={`profile-left-sidebar${open ? ' is-open' : ''}`}>
      {children}
    </aside>
  )
}
