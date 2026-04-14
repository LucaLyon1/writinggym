'use client'

import { useState } from 'react'
import {
  FOCUS_AXES,
  SESSION_LENGTHS,
  type FocusAxis,
  type SessionLength,
  type SessionConfig,
} from '@/lib/session'

interface SessionSetupProps {
  onStart: (config: SessionConfig) => void
}

export function SessionSetup({ onStart }: SessionSetupProps) {
  const [focusAxis, setFocusAxis] = useState<FocusAxis | null>(null)
  const [sessionLength, setSessionLength] = useState<SessionLength>(30)

  const canStart = focusAxis !== null

  function handleStart() {
    if (!focusAxis) return
    onStart({ focusAxis, sessionLength })
  }

  return (
    <div className="ss-root">
      <div className="ss-inner">
        <header className="ss-header">
          <h1 className="ss-title">Practice Session</h1>
          <p className="ss-subtitle">Choose your focus and session length for deliberate practice</p>
        </header>

        <div className="ss-section">
          <h2 className="ss-section-title">Focus axis</h2>
          <p className="ss-section-desc">What aspect of craft do you want to work on?</p>
          <div className="ss-axis-grid">
            {FOCUS_AXES.map((axis) => (
              <button
                key={axis.id}
                className={`ss-axis-card ${focusAxis === axis.id ? 'ss-axis-active' : ''}`}
                onClick={() => setFocusAxis(axis.id)}
              >
                <span className="ss-axis-label">{axis.label}</span>
                <span className="ss-axis-desc">{axis.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="ss-section">
          <h2 className="ss-section-title">Session length</h2>
          <div className="ss-length-row">
            {SESSION_LENGTHS.map((opt) => (
              <button
                key={opt.value}
                className={`ss-length-btn ${sessionLength === opt.value ? 'ss-length-active' : ''}`}
                onClick={() => setSessionLength(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          className="ss-start-btn"
          disabled={!canStart}
          onClick={handleStart}
        >
          Begin session →
        </button>
      </div>
    </div>
  )
}
