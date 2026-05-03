'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { passages } from '@/data/passages'

function ExplorePreviewModal({
  item,
  onClose,
}: {
  item: ExploreItem
  onClose: () => void
}) {
  const passageMap = new Map(passages.map((p) => [p.id, p]))
  const passage = passageMap.get(item.passage_id)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="sc-overlay" onClick={onClose}>
      <div className="submission-preview-modal" onClick={(e) => e.stopPropagation()}>
        <button className="sc-close" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="2" y1="2" x2="12" y2="12" />
            <line x1="12" y1="2" x2="2" y2="12" />
          </svg>
        </button>
        <div className="submission-preview-meta">
          {passage && (
            <Link href={`/extract/${passage.id}`} className="explore-card-title" onClick={onClose}>
              <em>{passage.title}</em>
              <span className="explore-card-author" style={{ marginLeft: '0.35rem' }}>— {passage.author}</span>
            </Link>
          )}
          {item.word_count != null && (
            <span className="submission-preview-words">{item.word_count} words</span>
          )}
          <UpvoteButton
            completionId={item.id}
            initialCount={item.upvote_count}
            initialUpvoted={item.viewer_has_upvoted}
          />
        </div>
        <p className="submission-preview-text">{item.user_text ?? ''}</p>
      </div>
    </div>
  )
}

interface ExploreItem {
  id: string
  user_text: string | null
  word_count: number | null
  completed_at: string
  passage_id: string
  constraint_key: string
  upvote_count: number
  viewer_has_upvoted: boolean
}

interface ExploreResponse {
  items: ExploreItem[]
  hasMore: boolean
  total: number
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function UpvoteButton({
  completionId,
  initialCount,
  initialUpvoted,
}: {
  completionId: string
  initialCount: number
  initialUpvoted: boolean
}) {
  const [count, setCount] = useState(initialCount)
  const [upvoted, setUpvoted] = useState(initialUpvoted)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch('/api/upvotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionId }),
      })
      if (res.ok) {
        const data = (await res.json()) as { upvoted: boolean; count: number }
        setUpvoted(data.upvoted)
        setCount(data.count)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      className={`upvote-btn${upvoted ? ' upvote-btn-active' : ''}`}
      onClick={toggle}
      disabled={loading}
      title={upvoted ? 'Remove upvote' : 'Upvote this rewrite'}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill={upvoted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
      {count > 0 ? count : null}
    </button>
  )
}

function ExploreCard({ item, onOpen }: { item: ExploreItem; onOpen: () => void }) {
  const passageMap = new Map(passages.map((p) => [p.id, p]))
  const passage = passageMap.get(item.passage_id)

  return (
    <article className="explore-card">
      <header className="explore-card-header">
        <div className="explore-card-passage">
          {passage ? (
            <>
              <Link href={`/extract/${passage.id}`} className="explore-card-title">
                {passage.title}
              </Link>
              <span className="explore-card-author">— {passage.author}</span>
            </>
          ) : (
            <span className="explore-card-title">Unknown passage</span>
          )}
        </div>
        <time className="explore-card-date" dateTime={item.completed_at}>
          {formatDate(item.completed_at)}
        </time>
      </header>

      {item.user_text && (
        <button type="button" className="explore-card-text-btn" onClick={onOpen}>
          <p className="explore-card-text">{item.user_text}</p>
        </button>
      )}

      <footer className="explore-card-footer">
        {item.word_count != null && (
          <span className="explore-card-words">{item.word_count} words</span>
        )}
        <UpvoteButton
          completionId={item.id}
          initialCount={item.upvote_count}
          initialUpvoted={item.viewer_has_upvoted}
        />
      </footer>
    </article>
  )
}

export function ExploreList({
  initialItems,
  initialHasMore,
  initialTotal,
}: {
  initialItems: ExploreItem[]
  initialHasMore: boolean
  initialTotal: number
}) {
  const [items, setItems] = useState<ExploreItem[]>(initialItems)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [total] = useState(initialTotal)
  const [activeItem, setActiveItem] = useState<ExploreItem | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const res = await fetch(`/api/explore?offset=${items.length}`)
      if (res.ok) {
        const data = (await res.json()) as ExploreResponse
        setItems((prev) => [...prev, ...data.items])
        setHasMore(data.hasMore)
      }
    } finally {
      setLoading(false)
    }
  }, [items.length, loading, hasMore])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  if (items.length === 0) {
    return (
      <p className="explore-empty">
        No public rewrites yet. Be the first to{' '}
        <Link href="/" className="explore-empty-link">share yours</Link>.
      </p>
    )
  }

  return (
    <>
      <p className="explore-count">{total} rewrite{total !== 1 ? 's' : ''} shared</p>
      <div className="explore-grid">
        {items.map((item) => (
          <ExploreCard key={item.id} item={item} onOpen={() => setActiveItem(item)} />
        ))}
      </div>
      <div ref={sentinelRef} className="explore-sentinel" aria-hidden />
      {loading && <p className="explore-loading">Loading…</p>}
      {activeItem && (
        <ExplorePreviewModal item={activeItem} onClose={() => setActiveItem(null)} />
      )}
    </>
  )
}
