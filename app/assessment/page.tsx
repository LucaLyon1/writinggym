'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { passages, categories } from '@/data/passages'
import type { Passage } from '@/data/passages'
import { AppFooter } from '@/components/AppFooter'

const PROMPTS = [
  'Describe a place you know well — a room, a street, a landscape — in a single paragraph.',
  'Write the opening of a story you would want to keep reading.',
  'Capture a conversation between two people who disagree but never raise their voice.',
  'Recount a small, real moment from your life that changed how you see something.',
]

interface AssessmentResult {
  strong_points: string[]
  weak_points: string[]
  next_step: string
  verdict: string
  recommended_category: string
  reason: string
}

function pickThreeFromCategory(categoryId: string): Passage[] {
  const pool = passages.filter((p) => p.categoryId === categoryId)
  if (pool.length <= 3) return pool
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

export default function AssessmentPage() {
  const [mode, setMode] = useState<'free' | 'prompted' | null>(null)
  const [prompt, setPrompt] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AssessmentResult | null>(null)

  function pickPrompt() {
    setMode('prompted')
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])
  }

  async function handleAnalyse() {
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        return
      }
      setResult(data as AssessmentResult)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setMode(null)
    setText('')
    setPrompt(null)
    setResult(null)
    setError(null)
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  const recommendedCategory = result
    ? categories.find((c) => c.id === result.recommended_category)
    : null
  const recommendedPassages = useMemo(
    () => (result ? pickThreeFromCategory(result.recommended_category) : []),
    [result]
  )

  if (result) {
    return (
      <div className="assess-root">
        <div className="assess-inner assess-inner-wide">
          <header className="assess-header">
            <span className="assess-eyebrow">Your craft profile</span>
            <h1 className="assess-title">{result.verdict}</h1>
          </header>

          <div className="assess-result-grid">
            {result.strong_points.length > 0 && (
              <section className="assess-result-block assess-result-strong">
                <h2 className="assess-result-heading">What works</h2>
                <ul className="assess-result-list">
                  {result.strong_points.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </section>
            )}
            {result.weak_points.length > 0 && (
              <section className="assess-result-block assess-result-weak">
                <h2 className="assess-result-heading">What to work on</h2>
                <ul className="assess-result-list">
                  {result.weak_points.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {result.next_step && (
            <section className="assess-next">
              <span className="assess-next-label">Try this next</span>
              <p className="assess-next-text">{result.next_step}</p>
            </section>
          )}

          {recommendedCategory && recommendedPassages.length > 0 && (
            <section className="assess-recommend">
              <div className="assess-recommend-header">
                <span className="assess-recommend-label">Start here</span>
                <h2 className="assess-recommend-title">
                  {recommendedCategory.label}
                </h2>
                <p className="assess-recommend-reason">{result.reason}</p>
              </div>
              <div className="assess-recommend-grid">
                {recommendedPassages.map((p) => (
                  <Link
                    key={p.id}
                    href={`/extract/${p.id}`}
                    className="assess-recommend-card"
                  >
                    <span className="assess-recommend-author">
                      {p.author} · {p.work}
                    </span>
                    <span className="assess-recommend-passage-title">
                      {p.title}
                    </span>
                    <span className="assess-recommend-cta">
                      Open extract →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="assess-result-actions">
            <button className="assess-reset-btn" onClick={handleReset}>
              ← Write a new sample
            </button>
            <Link href="/" className="assess-browse-link">
              Browse the full library
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="assess-root">
      <div className="assess-inner">
        <header className="assess-header">
          <h1 className="assess-title">Find your craft profile</h1>
          <p className="assess-lead">
            Write a short passage — a few hundred words is enough — and we&rsquo;ll
            show you your natural strengths and the areas where you can grow as
            a writer.
          </p>
          <p className="assess-lead assess-lead-secondary">
            No scores, no numbers — just honest feedback that points you toward
            the practice sessions that matter most for you right now.
          </p>
        </header>

        {mode === null && (
          <div className="assess-choice">
            <button
              className="assess-choice-btn"
              onClick={() => setMode('free')}
            >
              <span className="assess-choice-icon">✎</span>
              <span className="assess-choice-label">Free writing</span>
              <span className="assess-choice-desc">
                Write anything — a scene, a memory, an opening paragraph.
                Whatever feels natural.
              </span>
            </button>
            <button className="assess-choice-btn" onClick={pickPrompt}>
              <span className="assess-choice-icon">◇</span>
              <span className="assess-choice-label">Use a prompt</span>
              <span className="assess-choice-desc">
                We&rsquo;ll give you a short direction to get the words moving.
              </span>
            </button>
          </div>
        )}

        {mode !== null && (
          <div className="assess-editor">
            {mode === 'prompted' && prompt && (
              <div className="assess-prompt-card">
                <span className="assess-prompt-label">Prompt</span>
                <p className="assess-prompt-text">{prompt}</p>
                <button
                  className="assess-prompt-shuffle"
                  onClick={pickPrompt}
                >
                  Different prompt ↻
                </button>
              </div>
            )}

            <textarea
              className="assess-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                mode === 'free'
                  ? 'Start writing — a scene, a memory, a character, anything…'
                  : 'Write your response here…'
              }
              rows={14}
              autoFocus
              disabled={loading}
            />

            {error && <p className="assess-error">{error}</p>}

            <div className="assess-footer">
              <div className="assess-meta">
                <span className="assess-word-count">{wordCount} words</span>
                <button
                  className="assess-reset"
                  onClick={handleReset}
                  disabled={loading}
                >
                  ← Start over
                </button>
              </div>
              <button
                className="assess-submit"
                disabled={wordCount < 30 || loading}
                onClick={handleAnalyse}
              >
                {loading ? 'Analysing…' : 'Analyse my writing →'}
              </button>
            </div>
          </div>
        )}
      </div>
      <AppFooter />
    </div>
  )
}
