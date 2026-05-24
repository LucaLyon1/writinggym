'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { passages, categories } from '@/data/passages'
import type { Tables } from '@/types/database.types'
import { deleteCompletionAction } from '@/app/actions/completions'

type PassageCompletion = Tables<'passage_completions'>

const PAGE_SIZE = 5

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getCategoryLabel(categoryId: string) {
  return categories.find((c) => c.id === categoryId)?.label ?? categoryId
}

function getFeedbackSummary(feedback: unknown): string | null {
  if (!feedback || typeof feedback !== 'object') return null
  const f = feedback as { summary?: string[]; feedback?: string }
  if (Array.isArray(f.summary) && f.summary.length > 0) {
    return f.summary[0]
  }
  if (typeof f.feedback === 'string') {
    return f.feedback.slice(0, 150) + (f.feedback.length > 150 ? '…' : '')
  }
  return null
}

function VisibilityToggle({ id, initialIsPublic }: { id: string; initialIsPublic: boolean }) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/completions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: !isPublic }),
      })
      if (res.ok) setIsPublic((prev) => !prev)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      className={`profile-card-visibility${isPublic ? ' profile-card-visibility-public' : ''}`}
      onClick={toggle}
      disabled={loading}
      title={isPublic ? 'Visible to others — click to make private' : 'Private — click to share publicly'}
    >
      {isPublic ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="3" />
            <path d="M2 12C4.5 6 8.5 3 12 3s7.5 3 10 9c-2.5 6-6.5 9-10 9s-7.5-3-10-9z" />
          </svg>
          Public
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
          Private
        </>
      )}
    </button>
  )
}

function SubmissionCard({
  c,
  passage,
}: {
  c: PassageCompletion
  passage: (typeof passages)[number] | undefined
}) {
  const feedbackSummary = getFeedbackSummary(c.feedback)
  return (
    <li className="profile-card">
      <div className="profile-card-header">
        <span className="profile-card-category">
          {passage ? getCategoryLabel(passage.categoryId) : 'Unknown'}
        </span>
        <time className="profile-card-date" dateTime={c.completed_at}>
          {formatDate(c.completed_at)}
        </time>
      </div>
      <h2 className="profile-card-title">
        {passage ? (
          <>
            <em>{passage.title}</em>
            <span className="profile-card-work">
              — {passage.author}, {passage.work}
            </span>
          </>
        ) : (
          <>Passage {c.passage_id}</>
        )}
      </h2>
      {c.user_text && (
        <div className="profile-card-user-text">
          <span className="profile-card-label">Your rewrite</span>
          <p className="profile-card-text">{c.user_text}</p>
        </div>
      )}
      {feedbackSummary && (
        <div className="profile-card-feedback">
          <span className="profile-card-label">Feedback</span>
          <p className="profile-card-text">{feedbackSummary}</p>
        </div>
      )}
      <div className="profile-card-meta">
        {c.word_count != null && (
          <span className="profile-card-word-count">{c.word_count} words</span>
        )}
        <div className="profile-card-actions">
          <VisibilityToggle id={c.id} initialIsPublic={c.is_public} />
          {passage && (
            <Link href={`/extract/${passage.id}`} className="profile-card-link">
              Try again →
            </Link>
          )}
          <form action={deleteCompletionAction} className="profile-card-delete-form">
            <input type="hidden" name="id" value={c.id} />
            <button
              type="submit"
              className="profile-card-delete"
              title="Delete this submission"
            >
              Delete
            </button>
          </form>
        </div>
      </div>
    </li>
  )
}

type FilterMode = 'all' | 'public' | 'private'

export function ProfileSubmissionsList({
  initialCompletions,
}: {
  initialCompletions: PassageCompletion[]
}) {
  const [completions, setCompletions] = useState<PassageCompletion[]>(initialCompletions)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialCompletions.length === PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [filter, setFilter] = useState<FilterMode>('all')

  const passageMap = new Map(passages.map((p) => [p.id, p]))

  const filtered = useMemo(() => {
    let result = completions
    if (filter === 'public') result = result.filter((c) => c.is_public)
    if (filter === 'private') result = result.filter((c) => !c.is_public)
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter((c) => {
        const p = passageMap.get(c.passage_id)
        return (
          (c.user_text && c.user_text.toLowerCase().includes(q)) ||
          (p && p.title.toLowerCase().includes(q)) ||
          (p && p.author.toLowerCase().includes(q))
        )
      })
    }
    return result
  }, [completions, filter, search, passageMap])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/profile/completions?offset=${completions.length}&limit=${PAGE_SIZE}`
      )
      if (res.ok) {
        const data = (await res.json()) as PassageCompletion[]
        setCompletions((prev) => [...prev, ...data])
        setHasMore(data.length === PAGE_SIZE)
      } else {
        setHasMore(false)
      }
    } catch {
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [completions.length, hasMore, loading])

  return (
    <>
      <header className={`ea-stage-head profile-stage-toolbar${searchOpen ? ' profile-toolbar-expanded' : ''}`}>
        {searchOpen ? (
          <div className="profile-search-row">
            <input
              type="search"
              className="profile-search-input"
              placeholder="Search by title, author, or text…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            <button
              type="button"
              className="profile-search-close"
              onClick={() => { setSearchOpen(false); setSearch('') }}
              aria-label="Close search"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="2" y1="2" x2="12" y2="12" />
                <line x1="12" y1="2" x2="2" y2="12" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            <h2 className="ea-stage-title">Your writing</h2>
            <div className="profile-stage-actions">
              <div className="profile-filter-pills">
                {(['all', 'public', 'private'] as FilterMode[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`profile-filter-pill${filter === f ? ' is-active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="profile-search-btn"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </div>
          </>
        )}
      </header>
      <div className="ea-stage-body profile-stage-body">
        {filtered.length === 0 ? (
          <p className="profile-no-results">No submissions match your filters.</p>
        ) : (
          <ul className="profile-list">
            {filtered.map((c) => (
              <SubmissionCard
                key={c.id}
                c={c}
                passage={passageMap.get(c.passage_id)}
              />
            ))}
          </ul>
        )}
        {hasMore && !search && filter === 'all' && (
          <div className="profile-load-more">
            <button
              type="button"
              onClick={loadMore}
              disabled={loading}
              className="profile-load-more-btn"
            >
              {loading ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
