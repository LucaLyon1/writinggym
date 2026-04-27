'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ScoreCard, type FeedbackForScoreCard } from '@/components/ScoreCard'
import { CraftPromptGallery } from '@/components/CraftPromptGallery'
import { craftPlaygroundPrompts } from '@/data/playground-prompts'
import { CATEGORIES } from '@/lib/categories'
import { createClient } from '@/lib/supabase/client'
import { playgroundPassageId } from '@/lib/playground-passage'

type PlaygroundMode = 'guided' | 'freetext'

interface AuthorAnalysis {
  author: string
  confidence: number
  traits: string[]
  excerpt_highlight: string
  suggestion: string
}

interface PlaygroundSubmission {
  id: string
  user_text: string | null
  feedback: Record<string, unknown> | null
  word_count: number | null
  completed_at: string
}

function parseStoredAuthorAnalysis(
  raw: Record<string, unknown> | null
): AuthorAnalysis | null {
  if (!raw || typeof raw !== 'object') return null
  if (typeof raw.author !== 'string' || !Array.isArray(raw.traits)) return null
  if (!raw.traits.every((t) => typeof t === 'string')) return null
  if (typeof raw.excerpt_highlight !== 'string') return null
  if (typeof raw.suggestion !== 'string') return null
  if (typeof raw.confidence !== 'number') return null
  return raw as unknown as AuthorAnalysis
}

export default function PlaygroundPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [mode, setMode] = useState<PlaygroundMode>('guided')
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [analysis, setAnalysis] = useState<AuthorAnalysis | null>(null)
  const [feedback, setFeedback] = useState<FeedbackForScoreCard | null>(null)
  const [showFeedbackCard, setShowFeedbackCard] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submittedCompletionId, setSubmittedCompletionId] = useState<
    string | null
  >(null)
  const [submittedTextSnapshot, setSubmittedTextSnapshot] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<PlaygroundSubmission[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const prompt = craftPlaygroundPrompts.find((p) => p.id === selectedPrompt)

  const fetchSubmissions = useCallback(async () => {
    if (!prompt) return
    setSubmissionsLoading(true)
    try {
      const res = await fetch(
        `/api/completions?passageId=${encodeURIComponent(playgroundPassageId(prompt.id))}&constraint=${encodeURIComponent(prompt.prompt)}`
      )
      if (!res.ok) {
        setSubmissions([])
        return
      }
      const data = (await res.json()) as PlaygroundSubmission[]
      setSubmissions(data)
    } catch {
      setSubmissions([])
    } finally {
      setSubmissionsLoading(false)
    }
  }, [prompt])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  function formatSubmissionDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function handleLoadSubmission(s: PlaygroundSubmission) {
    const t = s.user_text ?? ''
    setText(t)
    setSubmittedTextSnapshot(t.trim())
    setSubmittedCompletionId(s.id)
    setAnalysis(parseStoredAuthorAnalysis(s.feedback))
    setError(null)
  }

  async function handleDeleteSubmission(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/completions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSubmissions((prev) => prev.filter((x) => x.id !== id))
        if (id === submittedCompletionId) {
          setSubmittedCompletionId(null)
          setSubmittedTextSnapshot('')
          setAnalysis(null)
        }
      }
    } finally {
      setDeletingId(null)
    }
  }

  const isSubmittedVersion =
    submittedCompletionId !== null && text.trim() === submittedTextSnapshot
  const canSubmit =
    !submitLoading && text.trim().length > 0 && !isSubmittedVersion
  const canAnalyze =
    !isLoading &&
    !submitLoading &&
    analysis === null &&
    submittedCompletionId != null &&
    isSubmittedVersion &&
    wordCount >= 30

  async function handleSubmit() {
    if (!prompt || !text.trim()) return
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      const nextPath = pathname ?? '/playground'
      try {
        sessionStorage.setItem(
          'proselab-draft',
          JSON.stringify({ pathname: nextPath, userText: text.trim() })
        )
      } catch {
        // sessionStorage may be unavailable
      }
      router.push(`/signup?next=${encodeURIComponent(nextPath)}`)
      return
    }

    setError(null)
    setSubmitLoading(true)
    try {
      const res = await fetch('/api/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passageId: playgroundPassageId(prompt.id),
          constraint: prompt.prompt,
          userText: text.trim(),
          wordCount,
        }),
      })
      if (res.status === 401) {
        const nextPath = pathname ?? '/playground'
        try {
          sessionStorage.setItem(
            'proselab-draft',
            JSON.stringify({ pathname: nextPath, userText: text.trim() })
          )
        } catch {
          // sessionStorage may be unavailable
        }
        router.push(`/signup?next=${encodeURIComponent(nextPath)}`)
        return
      }
      if (res.status === 403) {
        const data = (await res.json()) as {
          requiresUpgrade?: boolean
          error?: string
        }
        if (data.requiresUpgrade) {
          setError(
            data.error ??
              'Upgrade to save more sessions, or try again tomorrow.'
          )
          return
        }
      }
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to save your writing')
      }
      const data = (await res.json()) as { id: string; success: boolean }
      setSubmittedCompletionId(data.id)
      setSubmittedTextSnapshot(text.trim())
      void fetchSubmissions()
      try {
        sessionStorage.removeItem('proselab-draft')
      } catch {
        // sessionStorage may be unavailable
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save your writing'
      )
    } finally {
      setSubmitLoading(false)
    }
  }

  async function handleAnalyze() {
    if (!prompt || wordCount < 30) return
    if (!submittedCompletionId) {
      setError('Submit your writing before requesting analysis.')
      return
    }
    if (text.trim() !== submittedTextSnapshot) {
      setError('Submit your writing before requesting analysis.')
      return
    }

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      const nextPath = pathname ?? '/playground'
      try {
        sessionStorage.setItem(
          'proselab-draft',
          JSON.stringify({ pathname: nextPath, userText: text.trim() })
        )
      } catch {
        // sessionStorage may be unavailable
      }
      router.push(`/signup?next=${encodeURIComponent(nextPath)}`)
      return
    }

    setIsLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      const res = await fetch('/api/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          prompt: prompt.prompt,
          passageId: playgroundPassageId(prompt.id),
          completionId: submittedCompletionId,
        }),
      })

      const data = await res.json()

      if (res.status === 401) {
        const nextPath = pathname ?? '/playground'
        try {
          sessionStorage.setItem(
            'proselab-draft',
            JSON.stringify({ pathname: nextPath, userText: text.trim() })
          )
        } catch {
          // sessionStorage may be unavailable
        }
        router.push(`/signup?next=${encodeURIComponent(nextPath)}`)
        return
      }

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        return
      }

      setAnalysis(data as AuthorAnalysis)
      void fetchSubmissions()
      try {
        sessionStorage.removeItem('proselab-draft')
      } catch {
        // sessionStorage may be unavailable
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleFreetextFeedback() {
    if (wordCount < 30) return
    setIsLoading(true)
    setError(null)
    setFeedback(null)

    try {
      const res = await fetch('/api/playground-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        return
      }

      setFeedback(data as FeedbackForScoreCard)
      setShowFeedbackCard(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleReset() {
    setSelectedPrompt(null)
    setText('')
    setAnalysis(null)
    setFeedback(null)
    setShowFeedbackCard(false)
    setError(null)
    setSubmittedCompletionId(null)
    setSubmittedTextSnapshot('')
    setSubmissions([])
  }

  const modeToggle = (
    <div className="pg-mode-toggle">
      <button
        type="button"
        className={`pg-mode-btn ${mode === 'guided' ? 'pg-mode-active' : ''}`}
        onClick={() => {
          setMode('guided')
          handleReset()
        }}
      >
        Guided prompts
      </button>
      <button
        type="button"
        className={`pg-mode-btn ${mode === 'freetext' ? 'pg-mode-active' : ''}`}
        onClick={() => {
          setMode('freetext')
          handleReset()
        }}
      >
        Freetext
      </button>
    </div>
  )

  if (mode === 'guided' && !selectedPrompt) {
    return (
      <div className="home-gallery-shell">
        <div className="home-gallery-main">
          <CraftPromptGallery
            onSelect={(p) => setSelectedPrompt(p.id)}
            hero={
              <div className="home-hero home-gallery-hero">
                <h1 className="home-title">Writing Playground</h1>
                <p className="home-subtitle">
                  Browse craft prompts the same way you browse extracts — filter
                  by category, search, then open a prompt and write. See which
                  author your voice resembles.
                </p>
                {modeToggle}
              </div>
            }
          />
        </div>
      </div>
    )
  }

  const showFullHero = mode === 'freetext'
  const busy = isLoading || submitLoading

  const guidedWithPrompt = mode === 'guided' && selectedPrompt

  return (
    <div
      className={`pg-root ${showFullHero ? '' : 'pg-root--session'} ${guidedWithPrompt ? 'pg-root--with-sidebar' : ''}`}
    >
      {showFullHero ? (
        <div className="pg-hero">
          <h1 className="pg-title">Writing Playground</h1>
          <p className="pg-subtitle">
            Write freely and get craft feedback — what works, what to improve,
            and one thing to try next.
          </p>
          {modeToggle}
        </div>
      ) : (
        <header className="pg-session-bar">
          <button
            type="button"
            className="pg-return-prompts"
            onClick={handleReset}
            disabled={busy}
          >
            ← Return to prompts
          </button>
        </header>
      )}

      {mode === 'freetext' ? (
        <div className="pg-workspace">
          <div className="pg-editor">
            <textarea
              className="pg-textarea"
              placeholder="Write anything — a scene, a memory, a description. At least 30 words."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              disabled={isLoading}
            />
            <div className="pg-editor-footer">
              <span className="pg-word-count">
                {wordCount} word{wordCount !== 1 ? 's' : ''}
                {wordCount > 0 && wordCount < 30 && (
                  <span className="pg-word-hint"> — write at least 30</span>
                )}
              </span>
              <button
                type="button"
                className="pg-btn-primary"
                onClick={handleFreetextFeedback}
                disabled={isLoading || wordCount < 30}
              >
                {isLoading ? 'Analysing…' : 'Get feedback'}
              </button>
            </div>
          </div>

          {error && <p className="pg-error">{error}</p>}

          {showFeedbackCard && feedback && (
            <ScoreCard feedback={feedback} onClose={() => setShowFeedbackCard(false)} />
          )}
        </div>
      ) : (
        <div className="pg-workspace">
          <div className="pg-guided-workspace">
            <div className="pg-guided-main">
              <div className="pg-active-prompt">
                <span className="pg-active-label">
                  {prompt
                    ? `${CATEGORIES[prompt.craft].label} · ${prompt.focus}`
                    : 'Your prompt'}
                </span>
                <p className="pg-prompt-title">{prompt?.title}</p>
                <p className="pg-active-text">{prompt?.prompt}</p>
              </div>

              <div className="pg-editor">
                <textarea
                  className="pg-textarea"
                  placeholder="Begin here…"
                  value={text}
                  onChange={(e) => {
                    const v = e.target.value
                    setText(v)
                    if (v.trim() !== submittedTextSnapshot) {
                      setSubmittedCompletionId(null)
                      setAnalysis(null)
                    }
                  }}
                  rows={8}
                  disabled={busy}
                />
                <div className="pg-editor-footer">
                  <span className="pg-word-count">
                    {wordCount} word{wordCount !== 1 ? 's' : ''}
                    {wordCount > 0 && wordCount < 30 && (
                      <span className="pg-word-hint"> — write at least 30</span>
                    )}
                  </span>
                  <div className="pg-actions">
                    <button
                      type="button"
                      className="ea-submit-btn"
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      title="Save to your account. Required before you can run analysis."
                    >
                      {submitLoading ? 'Saving…' : 'Submit'}
                    </button>
                    <button
                      type="button"
                      className="ea-analyze-btn"
                      onClick={handleAnalyze}
                      disabled={!canAnalyze}
                      title="Submit the current text first, then you can run analysis."
                    >
                      {isLoading ? 'Analysing…' : 'Analyze'}
                    </button>
                  </div>
                </div>
              </div>

              {error && <p className="pg-error">{error}</p>}

              {analysis && (
                <div className="pg-result">
                  <div className="pg-result-header">
                    <span className="pg-result-label">You sound like</span>
                    <h2 className="pg-result-author">{analysis.author}</h2>
                    <span className="pg-confidence">
                      {analysis.confidence}% match
                    </span>
                  </div>

                  <div className="pg-result-section">
                    <h3 className="pg-result-heading">Shared traits</h3>
                    <ul className="pg-traits">
                      {analysis.traits.map((trait, i) => (
                        <li key={i} className="pg-trait">{trait}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pg-result-section">
                    <h3 className="pg-result-heading">This passage especially</h3>
                    <blockquote className="pg-highlight">
                      {analysis.excerpt_highlight}
                    </blockquote>
                  </div>

                  <div className="pg-result-section">
                    <h3 className="pg-result-heading">To grow your voice</h3>
                    <p className="pg-suggestion">{analysis.suggestion}</p>
                  </div>

                  <button
                    type="button"
                    className="pg-btn-secondary pg-try-again"
                    onClick={handleReset}
                  >
                    Try another prompt
                  </button>
                </div>
              )}
            </div>

            <aside className="pg-guided-sidebar" aria-label="Saved drafts">
              <div className="ea-sidebar-section ea-submissions-section">
                <h3 className="ea-sidebar-heading">Previous submissions</h3>
                {submissionsLoading ? (
                  <p className="ea-submissions-loading">Loading…</p>
                ) : submissions.length === 0 ? (
                  <p className="ea-submissions-empty">
                    No saved drafts yet for this prompt. Submit your writing to
                    see it here — you can save without running Analyze.
                  </p>
                ) : (
                  <ul className="ea-submissions-list">
                    {submissions.map((s) => (
                      <li key={s.id} className="ea-submission-item">
                        <div className="ea-submission-meta">
                          <span className="ea-submission-date">
                            {formatSubmissionDate(s.completed_at)}
                          </span>
                          {s.word_count != null && (
                            <span className="ea-submission-words">
                              {s.word_count} words
                            </span>
                          )}
                        </div>
                        <div className="ea-submission-actions">
                          <button
                            type="button"
                            className="ea-submission-load"
                            onClick={() => handleLoadSubmission(s)}
                          >
                            Load
                          </button>
                          <button
                            type="button"
                            className="ea-submission-delete"
                            onClick={() => void handleDeleteSubmission(s.id)}
                            disabled={deletingId === s.id}
                            title="Delete this submission"
                          >
                            {deletingId === s.id ? '…' : 'Delete'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  )
}
