'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { passages } from '@/data/passages'

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

function ExploreCard({ item }: { item: ExploreItem }) {
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
        <p className="explore-card-text">
          {item.user_text}
        </p>
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
          <ExploreCard key={item.id} item={item} />
        ))}
      </div>
      <div ref={sentinelRef} className="explore-sentinel" aria-hidden />
      {loading && <p className="explore-loading">Loading…</p>}
    </>
  )
}
