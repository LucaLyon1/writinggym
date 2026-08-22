'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, memo, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { trialDaysLeft } from '@/lib/trial'

const NAV_LINKS = [
  { href: '/', label: 'Exercises', exact: true },
  { href: '/playground', label: 'Playground', exact: false },
  { href: '/community', label: 'Community', exact: false },
  { href: '/profile', label: 'Settings', exact: false },
]

let cachedDaysLeft: number | null | undefined = undefined

export const SidebarNav = memo(function SidebarNav({ footer }: { footer?: ReactNode } = {}) {
  const pathname = usePathname()
  const [daysLeft, setDaysLeft] = useState<number | null>(
    cachedDaysLeft !== undefined ? cachedDaysLeft : null
  )

  useEffect(() => {
    if (cachedDaysLeft !== undefined) {
      setDaysLeft(cachedDaysLeft)
      return
    }
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      const days = user ? trialDaysLeft(user.created_at) : null
      cachedDaysLeft = days
      setDaysLeft(days)
    })
  }, [])

  return (
    <div className="sidebar-nav">
      <nav className="sidebar-nav-links">
        {NAV_LINKS.map(({ href, label, exact }) => {
          const isActive = exact
            ? pathname === '/' || pathname.startsWith('/extract/')
            : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-nav-link${isActive ? ' is-active' : ''}`}
            >
              {label}
            </Link>
          )
        })}
      </nav>
      {footer}
      {daysLeft !== null && !footer && (
        <Link href="/pricing" className="sidebar-upgrade-btn">
          Upgrade <span className="sidebar-upgrade-days">({daysLeft} day{daysLeft === 1 ? '' : 's'} left)</span>
        </Link>
      )}
      <div className="sidebar-nav-footer">
        <span className="sidebar-nav-copy">&copy; 2026 ProseLab</span>
      </div>
    </div>
  )
})
