'use client'

import { useState } from 'react'
import { ScoreCard, type FeedbackForScoreCard } from '@/components/ScoreCard'

type PlaygroundMode = 'guided' | 'freetext'

interface AuthorAnalysis {
  author: string
  confidence: number
  traits: string[]
  excerpt_highlight: string
  suggestion: string
}

const PROMPTS = [
  {
    id: 'morning',
    title: 'The morning light',
    prompt:
      'Describe the first thing you see when you wake up, as if noticing it for the very first time.',
  },
  {
    id: 'stranger',
    title: 'A stranger observed',
    prompt:
      'You are sitting in a café. Describe a stranger who walks in — without using any adjectives about their personality.',
  },
  {
    id: 'memory',
    title: 'A childhood place',
    prompt:
      'Write about a place from your childhood using only sensory details — what you saw, heard, smelled, touched, tasted.',
  },
  {
    id: 'weather',
    title: 'The storm inside',
    prompt:
      'Describe a thunderstorm, but make it mirror an emotional state you have felt recently.',
  },
  {
    id: 'object',
    title: 'An ordinary object',
    prompt:
      'Pick an everyday object — a key, a cup, a shoe — and write about it as though it holds the entire history of a person.',
  },
  {
    id: 'walk',
    title: 'A walk at dusk',
    prompt:
      'You are walking through your neighbourhood at dusk. Write what you notice in the order you notice it.',
  },
  {
    id: 'conversation',
    title: 'The unspoken',
    prompt:
      'Write a short exchange between two people where the most important thing is never said aloud.',
  },
  {
    id: 'waiting',
    title: 'Waiting',
    prompt:
      'Describe the experience of waiting — in a queue, a hospital, an airport — and make the reader feel the weight of time.',
  },
  {
    id: 'meal',
    title: 'A meal remembered',
    prompt:
      'Write about a meal that mattered. Focus on the food, the setting, and one detail that made it unforgettable.',
  },
  {
    id: 'door',
    title: 'Behind the door',
    prompt:
      'A character opens a door they have been avoiding. Describe only what they see, hear, and feel in the first five seconds.',
  },
]

export default function PlaygroundPage() {
  const [mode, setMode] = useState<PlaygroundMode>('guided')
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [analysis, setAnalysis] = useState<AuthorAnalysis | null>(null)
  const [feedback, setFeedback] = useState<FeedbackForScoreCard | null>(null)
  const [showScoreCard, setShowScoreCard] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const prompt = PROMPTS.find((p) => p.id === selectedPrompt)

  async function handleAnalyse() {
    if (!prompt || wordCount < 30) return
    setIsLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      const res = await fetch('/api/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, prompt: prompt.prompt }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        return
      }

      setAnalysis(data as AuthorAnalysis)
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
      setShowScoreCard(true)
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
    setShowScoreCard(false)
    setError(null)
  }

  return (
    <div className="pg-root">
      <div className="pg-hero">
        <h1 className="pg-title">Writing Playground</h1>
        <p className="pg-subtitle">
          {mode === 'guided'
            ? 'Pick a prompt, write a paragraph or two, and discover which author your voice resembles.'
            : 'Write freely and get craft feedback — scores, verdict, and actionable suggestions.'}
        </p>
        <div className="pg-mode-toggle">
          <button
            type="button"
            className={`pg-mode-btn ${mode === 'guided' ? 'pg-mode-active' : ''}`}
            onClick={() => { setMode('guided'); handleReset() }}
          >
            Guided prompts
          </button>
          <button
            type="button"
            className={`pg-mode-btn ${mode === 'freetext' ? 'pg-mode-active' : ''}`}
            onClick={() => { setMode('freetext'); handleReset() }}
          >
            Freetext
          </button>
        </div>
      </div>

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
                className="pg-btn-primary"
                onClick={handleFreetextFeedback}
                disabled={isLoading || wordCount < 30}
              >
                {isLoading ? 'Analysing…' : 'Get feedback'}
              </button>
            </div>
          </div>

          {error && <p className="pg-error">{error}</p>}

          {showScoreCard && feedback && (
            <ScoreCard feedback={feedback} onClose={() => setShowScoreCard(false)} />
          )}
        </div>
      ) : !selectedPrompt ? (
        <div className="pg-prompts">
          <p className="pg-prompts-label">Choose a prompt to get started</p>
          <div className="pg-prompts-grid">
            {PROMPTS.map((p) => (
              <button
                key={p.id}
                className="pg-prompt-card"
                onClick={() => setSelectedPrompt(p.id)}
              >
                <span className="pg-prompt-title">{p.title}</span>
                <span className="pg-prompt-text">{p.prompt}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="pg-workspace">
          <div className="pg-active-prompt">
            <span className="pg-active-label">Your prompt</span>
            <p className="pg-active-text">{prompt?.prompt}</p>
          </div>

          <div className="pg-editor">
            <textarea
              className="pg-textarea"
              placeholder="Start writing here…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              disabled={isLoading}
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
                  className="pg-btn-secondary"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  Change prompt
                </button>
                <button
                  className="pg-btn-primary"
                  onClick={handleAnalyse}
                  disabled={isLoading || wordCount < 30}
                >
                  {isLoading ? 'Analysing…' : 'Who do I sound like?'}
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

              <button className="pg-btn-secondary pg-try-again" onClick={handleReset}>
                Try another prompt
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
