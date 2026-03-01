'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'proselab-onboarding-done'

interface Step {
  icon: string
  title: string
  description: string
  detail: string
}

const steps: Step[] = [
  {
    icon: '✦',
    title: 'Welcome to Proselab',
    description: 'A writing practice space where you learn by imitation — the way painters copy masters, the way musicians learn standards.',
    detail: 'Great writers learned by studying great writing. Proselab gives you the tools to do the same.',
  },
  {
    icon: '◈',
    title: 'Study the craft',
    description: 'Pick a passage from authors like Carver, Didion, or Morrison. Our AI breaks down the writing — structure, voice, imagery, pacing — so you can see how it works.',
    detail: 'Hover over highlighted text to read annotations. Use the category pills to filter by craft element.',
  },
  {
    icon: '✎',
    title: 'Write your version',
    description: 'Each extract comes with a writing constraint — a focused exercise to try a technique yourself. Write directly in the app with the original alongside for reference.',
    detail: 'There are no rules. The constraint is a guide, not a cage.',
  },
  {
    icon: '◉',
    title: 'Get honest feedback',
    description: 'Submit your writing and receive thoughtful AI critique — what worked, what could be stronger, and what to try next time.',
    detail: 'Save your rewrites, track your streaks, and watch your craft grow over time.',
  },
]

export function Onboarding() {
  const [visible, setVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) {
      setVisible(true)
      document.body.style.overflow = 'hidden'
    }
  }, [])

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
    document.body.style.overflow = ''
  }, [])

  const goTo = useCallback((next: number, dir: 'forward' | 'backward') => {
    if (animating) return
    setDirection(dir)
    setAnimating(true)
    setTimeout(() => {
      setCurrentStep(next)
      setAnimating(false)
    }, 200)
  }, [animating])

  const handleNext = useCallback(() => {
    if (currentStep === steps.length - 1) {
      dismiss()
    } else {
      goTo(currentStep + 1, 'forward')
    }
  }, [currentStep, dismiss, goTo])

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      goTo(currentStep - 1, 'backward')
    }
  }, [currentStep, goTo])

  useEffect(() => {
    if (!visible) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext()
      if (e.key === 'ArrowLeft') handleBack()
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [visible, handleNext, handleBack, dismiss])

  if (!visible) return null

  const step = steps[currentStep]
  const isLast = currentStep === steps.length - 1

  return (
    <div className="onboarding-overlay" onClick={dismiss}>
      <div
        className="onboarding-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to Proselab"
      >
        <button className="onboarding-skip" onClick={dismiss}>
          Skip
        </button>

        <div className="onboarding-step-number">
          {currentStep > 0
            ? `${currentStep} of ${steps.length - 1}`
            : ''}
        </div>

        <div className={`onboarding-body ${animating ? `onboarding-exit-${direction}` : 'onboarding-enter'}`}>
          <div className="onboarding-icon">{step.icon}</div>
          <h2 className="onboarding-title">{step.title}</h2>
          <p className="onboarding-description">{step.description}</p>
          <p className="onboarding-detail">{step.detail}</p>
        </div>

        <div className="onboarding-dots">
          {steps.map((_, i) => (
            <button
              key={i}
              className={`onboarding-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}`}
              onClick={() => goTo(i, i > currentStep ? 'forward' : 'backward')}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>

        <div className="onboarding-actions">
          {currentStep > 0 && (
            <button className="onboarding-back" onClick={handleBack}>
              ← Back
            </button>
          )}
          <button className="onboarding-next" onClick={handleNext}>
            {isLast ? 'Start exploring' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}
