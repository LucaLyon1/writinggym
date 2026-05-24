'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/', label: 'Exercises', exact: true },
  { href: '/playground', label: 'Playground', exact: false },
  { href: '/explore', label: 'Community', exact: false },
  { href: '/profile', label: 'Profile', exact: false },
]

export function SidebarNav() {
  const pathname = usePathname()

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
      <span className="sidebar-nav-copy">&copy; 2026 ProseLab</span>
    </div>
  )
}
