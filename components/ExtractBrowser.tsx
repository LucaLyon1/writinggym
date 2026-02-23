'use client'

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

export function ExtractBrowser({ onSelect }: ExtractBrowserProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [activeTags, setActiveTags] = useState<string[]>([])

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
    if (activeTags.length > 0) {
      result = result.filter((p) =>
        activeTags.every((tag) => p.tags.includes(tag))
      )
    }
    return result
  }, [activeCategoryId, activeTags])

  const activeCategory = categories.find((c) => c.id === activeCategoryId)

  const visibleTags = useMemo(() => {
    const tagSet = new Set<string>()
    for (const p of filtered) {
      for (const t of p.tags) tagSet.add(t)
    }
    return tags.filter((t) => tagSet.has(t.id))
  }, [filtered])

  function toggleTag(tagId: string) {
    setActiveTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : [...prev, tagId]
    )
  }

  return (
    <div className="browser-root">
      <header className="browser-header">
        <h1 className="gym-logo">
          <span className="gym-logo-mark">✦</span> Proselab
        </h1>
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

          {visibleTags.length > 0 && (
            <div className="tag-bar">
              {visibleTags.map((tag) => (
                <button
                  key={tag.id}
                  className={`tag-pill ${activeTags.includes(tag.id) ? 'active' : ''}`}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          )}

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
