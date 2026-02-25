'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { passages, categories, tags } from '@/data/passages'
import type { Passage } from '@/data/passages'

interface ExtractBrowserProps {
  onSelect: (passage: Passage) => void
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

export function ExtractBrowser({ onSelect }: ExtractBrowserProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

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
    result = result.filter((p) => matchesSearch(p, searchQuery))
    return result
  }, [activeCategoryId, searchQuery])

  const activeCategory = categories.find((c) => c.id === activeCategoryId)

  return (
    <div className="browser-root">
      <header className="browser-header">
        <Link href="/" className="gym-logo" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="gym-logo-mark">✦</span> Proselab
        </Link>
        <p className="browser-tagline">
          Pick an extract. Study the craft. Write your own.
        </p>
      </header>

      <div className="browser-body">
        <nav className="browser-sidebar">
          <span className="sidebar-label">Categories</span>
          <button
            className={`cat-btn ${!activeCategoryId ? 'active' : ''}`}
            onClick={() => setActiveCategoryId(null)}
          >
            <span className="cat-btn-label">All</span>
            <span className="cat-btn-count">{passages.length}</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`cat-btn ${activeCategoryId === cat.id ? 'active' : ''}`}
              onClick={() =>
                setActiveCategoryId(activeCategoryId === cat.id ? null : cat.id)
              }
            >
              <span className="cat-btn-label">{cat.label}</span>
              <span className="cat-btn-count">{passageCounts[cat.id] || 0}</span>
            </button>
          ))}
        </nav>

        <main className="browser-main">
          {activeCategory && (
            <div className="category-header">
              <h2 className="category-title">{activeCategory.label}</h2>
              <p className="category-desc">{activeCategory.description}</p>
            </div>
          )}

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
              return (
                <button
                  key={passage.id}
                  className="passage-tile"
                  onClick={() => onSelect(passage)}
                >
                  <span className="tile-category">{cat?.label}</span>
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
                    <span className="tile-twists">
                      {passage.twists.length} exercises
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
