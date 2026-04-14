'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { passages } from '@/data/passages'
import { SessionSetup } from '@/components/SessionSetup'
import { SessionTimer } from '@/components/SessionTimer'
import { AnalysisView } from '@/components/AnalysisView'
import {
  type SessionConfig,
  type FocusAxis,
  type SessionLength,
  selectPassageForSession,
  getAxisSpecificPromptGuidance,
  FOCUS_AXES,
} from '@/lib/session'

type SessionPhase = 'setup' | 'active'

const VALID_AXES: FocusAxis[] = ['dialogue', 'opening-lines', 'character-description', 'scene-setting', 'interiority', 'transitions', 'rhythm-and-style']
const VALID_LENGTHS: SessionLength[] = [15, 30, 45]

function SessionContent() {
  const searchParams = useSearchParams()
  const [phase, setPhase] = useState<SessionPhase>('setup')
  const [config, setConfig] = useState<SessionConfig | null>(null)
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(null)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [autoStarted, setAutoStarted] = useState(false)

  useEffect(() => {
    fetch('/api/completions/summary')
      .then((r) => r.ok ? r.json() : {})
      .then((data: Record<string, number>) => {
        setCompletedIds(new Set(Object.keys(data)))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (autoStarted || phase === 'active') return
    const axis = searchParams.get('axis') as FocusAxis | null
    const length = Number(searchParams.get('length')) as SessionLength

    if (axis && VALID_AXES.includes(axis)) {
      const sessionLength = VALID_LENGTHS.includes(length) ? length : 30
      const cfg: SessionConfig = { focusAxis: axis, sessionLength }
      const passage = selectPassageForSession(passages, cfg, completedIds)
      if (passage) {
        setConfig(cfg)
        setSelectedPassageId(passage.id)
        setPhase('active')
      }
      setAutoStarted(true)
    }
  }, [searchParams, completedIds, autoStarted, phase])

  const handleStart = useCallback((cfg: SessionConfig) => {
    const passage = selectPassageForSession(passages, cfg, completedIds)
    if (!passage) {
      alert('No passages available for this focus area. Try a different axis.')
      return
    }
    setConfig(cfg)
    setSelectedPassageId(passage.id)
    setPhase('active')
  }, [completedIds])

  if (phase === 'setup' || !config || !selectedPassageId) {
    return <SessionSetup onStart={handleStart} />
  }

  const passage = passages.find((p) => p.id === selectedPassageId)
  if (!passage) {
    return (
      <div className="ss-root">
        <p>Passage not found. <button onClick={() => setPhase('setup')}>Back to setup</button></p>
      </div>
    )
  }

  const axisConfig = FOCUS_AXES.find((a) => a.id === config.focusAxis)
  const guidance = getAxisSpecificPromptGuidance(config.focusAxis)

  return (
    <div className="session-active">
      <div className="session-bar">
        <button className="session-back" onClick={() => setPhase('setup')}>
          ← New session
        </button>
        <div className="session-bar-info">
          <span className="session-bar-axis">{axisConfig?.label}</span>
          <span className="session-bar-sep">·</span>
          <span className="session-bar-passage">{passage.title} — {passage.author}</span>
        </div>
        <SessionTimer durationMinutes={config.sessionLength} />
      </div>

      <div className="session-guidance">
        <p className="session-guidance-text">{guidance}</p>
      </div>

      <AnalysisView
        passage={passage}
        onBack={() => setPhase('setup')}
      />
    </div>
  )
}

export default function SessionPage() {
  return (
    <Suspense>
      <SessionContent />
    </Suspense>
  )
}
