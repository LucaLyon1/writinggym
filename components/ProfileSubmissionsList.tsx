'use client'

import { useState, useCallback } from 'react'
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

export function ProfileSubmissionsList({
  initialCompletions,
}: {
  initialCompletions: PassageCompletion[]
}) {
  const [completions, setCompletions] = useState<PassageCompletion[]>(initialCompletions)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialCompletions.length === PAGE_SIZE)

  const passageMap = new Map(passages.map((p) => [p.id, p]))

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

  if (completions.length === 0) {
    return null
  }

  return (
    <>
      <ul className="profile-list">
        {completions.map((c) => (
          <SubmissionCard
            key={c.id}
            c={c}
            passage={passageMap.get(c.passage_id)}
          />
        ))}
      </ul>
      {hasMore && (
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
    </>
  )
}
