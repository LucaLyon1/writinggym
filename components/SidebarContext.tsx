'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'

interface SidebarContextValue {
  open: boolean
  setOpen: (v: boolean) => void
  toggle: () => void
}

const SidebarContext = createContext<SidebarContextValue>({
  open: false,
  setOpen: () => {},
  toggle: () => {},
})

export function SidebarProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [state, setState] = useState({ pathname, open: false })
  const open = state.pathname === pathname && state.open

  if (state.pathname !== pathname) {
    setState({ pathname, open: false })
  }
  const setOpen = useCallback((value: boolean) => setState({ pathname, open: value }), [pathname])
  const toggle = useCallback(() => setState(previous => ({
    pathname,
    open: previous.pathname === pathname ? !previous.open : true,
  })), [pathname])
  const value = useMemo(() => ({ open, setOpen, toggle }), [open, setOpen, toggle])

  useEffect(() => {
    if (!open) return
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
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
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}
