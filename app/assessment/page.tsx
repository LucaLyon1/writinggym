'use client'

import { useState } from 'react'

const PROMPTS = [
  'Describe a place you know well — a room, a street, a landscape — in a single paragraph.',
  'Write the opening of a story you would want to keep reading.',
  'Capture a conversation between two people who disagree but never raise their voice.',
  'Recount a small, real moment from your life that changed how you see something.',
]

export default function AssessmentPage() {
  const [mode, setMode] = useState<'free' | 'prompted' | null>(null)
  const [prompt, setPrompt] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  function pickPrompt() {
    setMode('prompted')
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])
  }

  function handleAnalyse() {
    if (!text.trim()) return
    setLoading(true)
    // TODO: call /api/scores and render strength/weakness cards
    setTimeout(() => setLoading(false), 1500)
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <div className="assess-root">
      <div className="assess-inner">
        <header className="assess-header">
          <h1 className="assess-title">Find your craft profile</h1>
          <p className="assess-lead">
            Write a short passage — a few hundred words is enough — and we'll map
            your natural strengths and blind spots across the dimensions of craft:
            voice, rhythm, imagery, structure, dialogue, interiority.
          </p>
          <p className="assess-lead assess-lead-secondary">
            The results will point you toward the practice sessions and master
            passages that matter most for your growth right now.
          </p>
        </header>

        {mode === null && (
          <div className="assess-choice">
            <button className="assess-choice-btn" onClick={() => setMode('free')}>
              <span className="assess-choice-icon">✎</span>
              <span className="assess-choice-label">Free writing</span>
              <span className="assess-choice-desc">
                Write anything — a scene, a memory, an opening paragraph. Whatever feels natural.
              </span>
            </button>
            <button className="assess-choice-btn" onClick={pickPrompt}>
              <span className="assess-choice-icon">◇</span>
              <span className="assess-choice-label">Use a prompt</span>
              <span className="assess-choice-desc">
                We'll give you a short direction to get the words moving.
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
                <button className="assess-prompt-shuffle" onClick={pickPrompt}>
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
            />

            <div className="assess-footer">
              <div className="assess-meta">
                <span className="assess-word-count">{wordCount} words</span>
                <button
                  className="assess-reset"
                  onClick={() => { setMode(null); setText(''); setPrompt(null) }}
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
    </div>
  )
}
