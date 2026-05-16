'use client'

import { useState, useMemo, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { passages, categories, tags } from '@/data/passages'
import type { Difficulty, Passage } from '@/data/passages'

const DIFFICULTY_META: Record<Difficulty, { label: string; icon: string }> = {
  accessible: { label: 'Accessible', icon: '◇' },
  intermediate: { label: 'Intermediate', icon: '◆' },
  challenging: { label: 'Challenging', icon: '◆◆' },
}

interface ExtractBrowserProps {
  onSelect: (passage: Passage) => void
  /** Renders at the top of the main column only (sidebar stays full height). */
  hero?: ReactNode
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen).replace(/\s+\S*$/, '') + '…'
}

function matchesSearch(p: Passage, query: string): boolean {
  if (!query.trim()) return true
  const q = query.toLowerCase().trim()
  const tagLabels = p.tags
    .map((tid) => tags.find((t) => t.id === tid)?.label ?? '')
    .join(' ')
  return (
    p.title.toLowerCase().includes(q) ||
    p.author.toLowerCase().includes(q) ||
    p.work.toLowerCase().includes(q) ||
    p.text.toLowerCase().includes(q) ||
    tagLabels.toLowerCase().includes(q)
  )
}

export function ExtractBrowser({ onSelect, hero }: ExtractBrowserProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [completedByPassage, setCompletedByPassage] = useState<
    Record<string, number>
  >({})

  useEffect(() => {
    fetch('/api/completions/summary')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => (data ? setCompletedByPassage(data) : null))
      .catch(() => {})
  }, [])

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

  const passageCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of passages) {
      counts[p.categoryId] = (counts[p.categoryId] || 0) + 1
    }
    return counts
  }, [])

  const filtered = useMemo(() => {
    let result = passages
    if (activeCategoryId) {
      result = result.filter((p) => p.categoryId === activeCategoryId)
    }
    if (activeDifficulty) {
      result = result.filter((p) => p.difficulty === activeDifficulty)
    }
    result = result.filter((p) => matchesSearch(p, searchQuery))
    return result
  }, [activeCategoryId, activeDifficulty, searchQuery])

  const activeCategory = categories.find((c) => c.id === activeCategoryId)

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
            className={`cat-btn ${!activeCategoryId ? 'active' : ''}`}
            onClick={() => {
              setActiveCategoryId(null)
              setSidebarOpen(false)
            }}
          >
            <span className="cat-btn-label">All Passages</span>
            <span className="cat-btn-count">{passages.length}</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`cat-btn ${activeCategoryId === cat.id ? 'active' : ''}`}
              onClick={() => {
                setActiveCategoryId(activeCategoryId === cat.id ? null : cat.id)
                setSidebarOpen(false)
              }}
            >
              <span className="cat-btn-label">{cat.label}</span>
              <span className="cat-btn-count">{passageCounts[cat.id] || 0}</span>
            </button>
          ))}

          <span className="sidebar-label" style={{ marginTop: '1.25rem' }}>Difficulty</span>
          {(['accessible', 'intermediate', 'challenging'] as Difficulty[]).map((d) => (
            <button
              key={d}
              className={`cat-btn ${activeDifficulty === d ? 'active' : ''}`}
              onClick={() => {
                setActiveDifficulty(activeDifficulty === d ? null : d)
                setSidebarOpen(false)
              }}
            >
              <span className="cat-btn-label">
                <span className={`difficulty-dot difficulty-${d}`} />
                {DIFFICULTY_META[d].label}
              </span>
              <span className="cat-btn-count">
                {passages.filter((p) => p.difficulty === d).length}
              </span>
            </button>
          ))}

          <span className="sidebar-label" style={{ marginTop: '1.25rem' }}>Other pages</span>
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
              {activeCategory ? activeCategory.label : 'All Passages'}
            </h2>
            <p className="category-desc">
              {activeCategory
                ? activeCategory.description
                : 'Browse passages from masters, study your choice and try rewriting based on a prompt. Get your efforts analysed and learn how to improve.'}
            </p>
          </div>

          <div className="search-bar">
            <input
              type="search"
              placeholder="Search by title, author, work, or tags…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              aria-label="Search extracts"
            />
          </div>

          {filtered.length === 0 && (
            <p className="browser-empty">
              No extracts match these filters.
            </p>
          )}

          <div className="passage-grid">
            {filtered.map((passage) => {
              const cat = categories.find((c) => c.id === passage.categoryId)
              const hasCompleted = (completedByPassage[passage.id] ?? 0) > 0
              return (
                <button
                  key={passage.id}
                  className={`passage-tile ${hasCompleted ? 'passage-tile-completed' : ''}`}
                  onClick={() => onSelect(passage)}
                >
                  <div className="tile-top-badges">
                    <span className="tile-category">{cat?.label}</span>
                    {hasCompleted && (
                      <span
                        className="tile-completed-badge"
                        aria-label="Completed"
                      >
                        Completed
                      </span>
                    )}
                  </div>
                  <span className="tile-author">
                    {passage.author} · {passage.work}
                  </span>
                  <span className="tile-title">{passage.title}</span>
                  <p className="tile-preview">
                    {truncate(passage.text, 120)}
                  </p>
                  <div className="tile-tags">
                    {passage.tags.map((tagId) => {
                      const t = tags.find((x) => x.id === tagId)
                      return t ? (
                        <span key={tagId} className="tile-tag">
                          {t.label}
                        </span>
                      ) : null
                    })}
                  </div>
                  <div className="tile-footer">
                    <span className={`tile-difficulty tile-difficulty-${passage.difficulty}`}>
                      {DIFFICULTY_META[passage.difficulty].label}
                    </span>
                    <span className="tile-cta">Analyse →</span>
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
