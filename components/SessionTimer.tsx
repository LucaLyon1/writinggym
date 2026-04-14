'use client'

import { useEffect, useState, useCallback } from 'react'

interface SessionTimerProps {
  durationMinutes: number
  onTimeUp?: () => void
}

export function SessionTimer({ durationMinutes, onTimeUp }: SessionTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60)
  const [running, setRunning] = useState(true)

  useEffect(() => {
    if (!running || secondsLeft <= 0) return
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          onTimeUp?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, secondsLeft, onTimeUp])

  const toggle = useCallback(() => setRunning((r) => !r), [])

  const totalSeconds = durationMinutes * 60
  const elapsed = totalSeconds - secondsLeft
  const progress = (elapsed / totalSeconds) * 100

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const display = `${minutes}:${seconds.toString().padStart(2, '0')}`

  const isLow = secondsLeft < 60 && secondsLeft > 0
  const isDone = secondsLeft === 0

  return (
    <div className={`st-root ${isLow ? 'st-low' : ''} ${isDone ? 'st-done' : ''}`}>
      <div className="st-bar">
        <div
          className="st-bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="st-controls">
        <button className="st-toggle" onClick={toggle} title={running ? 'Pause' : 'Resume'}>
          {isDone ? '✓' : running ? '⏸' : '▶'}
        </button>
        <span className="st-time">{isDone ? 'Time\u2019s up' : display}</span>
      </div>
    </div>
  )
}
