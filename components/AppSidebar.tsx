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

export const SidebarNav = memo(function SidebarNav({ footer }: { footer?: ReactNode } = {}) {
  const pathname = usePathname()
  const [daysLeft, setDaysLeft] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createClient()
    // INITIAL_SESSION supplies the current user; subsequent events keep account
    // switches in sync without a separate auth request or a cross-user cache.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setDaysLeft(session?.user ? trialDaysLeft(session.user.created_at) : null)
    })
    return () => subscription.unsubscribe()
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
