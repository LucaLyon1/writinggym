'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { CATEGORIES } from '@/lib/categories'
import type { CraftCategory } from '@/types/extract'
import {
  craftPlaygroundPrompts,
  type CraftPlaygroundPrompt,
} from '@/data/playground-prompts'

interface CraftPromptGalleryProps {
  onSelect: (prompt: CraftPlaygroundPrompt) => void
  hero?: ReactNode
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen).replace(/\s+\S*$/, '') + '…'
}

function matchesSearch(p: CraftPlaygroundPrompt, query: string): boolean {
  if (!query.trim()) return true
  const q = query.toLowerCase().trim()
  return (
    p.title.toLowerCase().includes(q) ||
    p.focus.toLowerCase().includes(q) ||
    p.prompt.toLowerCase().includes(q) ||
    CATEGORIES[p.craft].label.toLowerCase().includes(q)
  )
}

const CRAFT_ORDER: CraftCategory[] = [
  'structure',
  'voice',
  'imagery',
  'pacing',
]

export function CraftPromptGallery({ onSelect, hero }: CraftPromptGalleryProps) {
  const [activeCraft, setActiveCraft] = useState<CraftCategory | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
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

  const counts = useMemo(() => {
    const c: Partial<Record<CraftCategory, number>> = {}
    for (const p of craftPlaygroundPrompts) {
      c[p.craft] = (c[p.craft] ?? 0) + 1
    }
    return c
  }, [])

  const filtered = useMemo(() => {
    let result = craftPlaygroundPrompts
    if (activeCraft) {
      result = result.filter((p) => p.craft === activeCraft)
    }
    result = result.filter((p) => matchesSearch(p, searchQuery))
    return result
  }, [activeCraft, searchQuery])

  const activeMeta = activeCraft ? CATEGORIES[activeCraft] : null

  return (
    <div className="browser-root browser-embedded">
      <div className={`browser-body ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <button
          type="button"
          className="browser-sidebar-toggle"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open filters"
        >
          <span aria-hidden="true">☰</span> Filters
        </button>
        <div
          className="browser-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
        <nav className="browser-sidebar">
          <span className="sidebar-label">Categories</span>
          <button
            className={`cat-btn ${!activeCraft ? 'active' : ''}`}
            onClick={() => {
              setActiveCraft(null)
              setSidebarOpen(false)
            }}
          >
            <span className="cat-btn-label">All Prompts</span>
            <span className="cat-btn-count">{craftPlaygroundPrompts.length}</span>
          </button>
          {CRAFT_ORDER.map((craft) => (
            <button
              key={craft}
              className={`cat-btn ${activeCraft === craft ? 'active' : ''}`}
              onClick={() => {
                setActiveCraft(activeCraft === craft ? null : craft)
                setSidebarOpen(false)
              }}
            >
              <span className="cat-btn-label">{CATEGORIES[craft].label}</span>
              <span className="cat-btn-count">{counts[craft] ?? 0}</span>
            </button>
          ))}

          <span className="sidebar-label" style={{ marginTop: '1.25rem' }}>Other pages</span>
          <Link href="/" className="cat-btn cat-btn-link">
            <span className="cat-btn-label">Exercises</span>
            <span className="cat-btn-arrow" aria-hidden="true">↗</span>
          </Link>
          <Link href="/explore" className="cat-btn cat-btn-link">
            <span className="cat-btn-label">Explore community</span>
            <span className="cat-btn-arrow" aria-hidden="true">↗</span>
          </Link>
          <Link href="/assessment" className="cat-btn cat-btn-link">
            <span className="cat-btn-label">Assessment</span>
            <span className="cat-btn-arrow" aria-hidden="true">↗</span>
          </Link>
        </nav>

        <main className="browser-main">
          {hero}
          <div className="category-header">
            <h2 className="category-title">
              {activeMeta ? activeMeta.label : 'All Prompts'}
            </h2>
            <p className="category-desc">
              {activeMeta
                ? activeMeta.description
                : 'Browse craft prompts the same way you browse extracts — filter by category, search, then open a prompt and write. See which author your voice resembles.'}
            </p>
          </div>

          <div className="search-bar">
            <input
              type="search"
              placeholder="Search by title, focus, category, or prompt text…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              aria-label="Search prompts"
            />
          </div>

          {filtered.length === 0 && (
            <p className="browser-empty">No prompts match these filters.</p>
          )}

          <div className="passage-grid">
            {filtered.map((p) => {
              const cat = CATEGORIES[p.craft]
              return (
                <button
                  key={p.id}
                  className="passage-tile"
                  onClick={() => onSelect(p)}
                >
                  <div className="tile-top-badges">
                    <span className="tile-category">{cat.label}</span>
                  </div>
                  <span className="tile-author">{p.focus}</span>
                  <span className="tile-title">{p.title}</span>
                  <p className="tile-preview">{truncate(p.prompt, 120)}</p>
                  <div className="tile-tags">
                    <span className="tile-tag">{p.focus}</span>
                  </div>
                  <div className="tile-footer tile-footer--end">
                    <span className="tile-cta">Open →</span>
                  </div>
                </button>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}
