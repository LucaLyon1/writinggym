'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const STORAGE_KEY = 'proselab-onboarding-done'

interface Step {
  icon: string
  title: string
  description: string
  detail: string
  isFinal?: boolean
}

const steps: Step[] = [
  {
    icon: '✦',
    title: 'Welcome to Proselab',
    description: 'A deliberate practice space for writers. Learn by imitation — the way painters copy masters, the way musicians learn standards.',
    detail: 'Great writers learned by studying great writing. Proselab gives you the structure to do the same.',
  },
  {
    icon: '◈',
    title: 'Choose your session',
    description: 'Pick a craft axis — dialogue, opening lines, interiority, scene-setting — and a session length. Proselab selects a passage from a master writer matched to your focus.',
    detail: 'Each session is intentional. You practice one dimension of craft at a time.',
  },
  {
    icon: '✎',
    title: 'Rewrite the passage',
    description: 'Study the original with AI craft analysis, then write your own version under a constraint. The constraint focuses your attention on the technique that matters.',
    detail: 'There are no rules. The constraint is a guide, not a cage.',
  },
  {
    icon: '◉',
    title: 'Get coached',
    description: 'Receive dimension-by-dimension analysis of where your instincts diverged from the original, a craft score across four axes, and one actionable thing to try next time.',
    detail: 'Track your scores over time. See which dimensions you improve in. Ask follow-up questions to go deeper.',
  },
  {
    icon: '◎',
    title: 'Where should you start?',
    description: "Take a quick writing assessment \u2014 write a short passage and we'll map your strengths and blind spots across the dimensions of craft. The results will point you toward the sessions and exercises that matter most.",
    detail: "It only takes a few minutes. Or skip it and dive straight into practice.",
    isFinal: true,
  },
]

export function Onboarding() {
  const router = useRouter()
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
          {currentStep > 0 && !isLast && (
            <button className="onboarding-back" onClick={handleBack}>
              ← Back
            </button>
          )}
          {isLast ? (
            <>
              <button
                className="onboarding-back"
                onClick={handleBack}
              >
                ← Back
              </button>
              <button
                className="onboarding-next"
                onClick={() => { dismiss(); router.push('/assessment') }}
              >
                Take the assessment
              </button>
              <button
                className="onboarding-skip-final"
                onClick={dismiss}
              >
                Skip — start practicing
              </button>
            </>
          ) : (
            <button className="onboarding-next" onClick={handleNext}>
              Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
