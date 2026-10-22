'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, memo, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { trialDaysLeft } from '@/lib/trial'

type NavLink = {
  href: string
  label: string
  exact: boolean
  badge?: 'new' | 'soon'
  disabled?: boolean
}

const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Drills', exact: true, badge: 'new' },
  { href: '/exercises', label: 'Exercises', exact: false },
  { href: '/playground', label: 'Playground', exact: false },
  { href: '/community', label: 'Community', exact: false, badge: 'soon', disabled: true },
  { href: '/profile', label: 'My Profile', exact: false },
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
        {NAV_LINKS.map(({ href, label, exact, badge, disabled }) => {
          const badgeEl = badge && (
            <span className={`sidebar-nav-badge sidebar-nav-badge--${badge}`}>{badge}</span>
          )

          if (disabled) {
            return (
              <span key={href} className="sidebar-nav-link is-disabled" aria-disabled="true">
                {label}
                {badgeEl}
              </span>
            )
          }

          const isActive = exact
            ? pathname === href
            : pathname.startsWith(href) || (href === '/exercises' && pathname.startsWith('/extract/'))

          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-nav-link${isActive ? ' is-active' : ''}`}
            >
              {label}
              {badgeEl}
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
