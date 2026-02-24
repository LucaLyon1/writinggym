'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const MANUSCRIPT_NOTES = {
  voice:
    "Woolf's interior voice: \"perpetual\" suggests something ongoing, inescapable — not a passing mood but a state of being. The word choice bleeds personality.",
  imagery:
    'Concrete anchor: the taxi cabs ground the abstract feeling. We see what she sees. The mundane detail makes the loneliness tangible.',
  structure:
    'Repetition creates rhythm: "out, out, far out" — each word pushes further. The syntax mirrors the feeling of distance, of being cast away.',
  pacing:
    '"Alone." A single word. The sentence stops. The pause lets the weight of isolation land before the next thought.',
} as const

function CraftTooltip({ note, children }: { note: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const ref = useRef<HTMLSpanElement>(null)

  const handleMouseEnter = () => setShow(true)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setPos({ x: rect.left + rect.width / 2, y: rect.top })
  }
  const handleMouseLeave = () => setShow(false)

  return (
    <>
      <span ref={ref} onMouseEnter={handleMouseEnter} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        {children}
      </span>
      {show &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="landing-ms-tooltip"
            style={{ left: pos.x, top: pos.y - 8, transform: 'translate(-50%, -100%)' }}
          >
            <span className="landing-ms-tooltip-text">{note}</span>
            <span className="landing-ms-tooltip-arrow" />
          </div>,
          document.body
        )}
    </>
  )
}

function TypewriterExercise() {
  const phrases = [
    { type: 'She felt the weight of the morning...', correct: 'She felt the weight of the morning light on her skin.' },
    { type: 'The city waited outside...', correct: 'The city waited outside the window, silent and vast.' },
    { type: 'Something shifted in the air...', correct: 'Something shifted in the air between them.' },
  ]
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting' | 'correcting' | 'done'>('typing')
  const [display, setDisplay] = useState('')
  const [displayIndex, setDisplayIndex] = useState(0)

  useEffect(() => {
    const { type, correct } = phrases[phraseIndex]

    if (phase === 'typing') {
      if (displayIndex < type.length) {
        const t = setTimeout(() => {
          setDisplay(type.slice(0, displayIndex + 1))
          setDisplayIndex(displayIndex + 1)
        }, 50)
        return () => clearTimeout(t)
      }
      const t = setTimeout(() => setPhase('pausing'), 400)
      return () => clearTimeout(t)
    }

    if (phase === 'pausing') {
      const t = setTimeout(() => setPhase('deleting'), 1200)
      return () => clearTimeout(t)
    }

    if (phase === 'deleting') {
      if (displayIndex > 0) {
        const t = setTimeout(() => {
          setDisplay(type.slice(0, displayIndex - 1))
          setDisplayIndex(displayIndex - 1)
        }, 30)
        return () => clearTimeout(t)
      }
      const t = setTimeout(() => {
        setPhase('correcting')
        setDisplayIndex(0)
      }, 200)
      return () => clearTimeout(t)
    }

    if (phase === 'correcting') {
      if (displayIndex < correct.length) {
        const t = setTimeout(() => {
          setDisplay(correct.slice(0, displayIndex + 1))
          setDisplayIndex(displayIndex + 1)
        }, 45)
        return () => clearTimeout(t)
      }
      const t = setTimeout(() => setPhase('done'), 800)
      return () => clearTimeout(t)
    }

    if (phase === 'done') {
      const t = setTimeout(() => {
        setPhase('typing')
        setDisplay('')
        setDisplayIndex(0)
        setPhraseIndex((phraseIndex + 1) % phrases.length)
      }, 1500)
      return () => clearTimeout(t)
    }
  }, [phase, displayIndex, phraseIndex])

  return (
    <div className="landing-typewriter">
      <span className="landing-typewriter-text">{display}</span>
      <span className="landing-typewriter-cursor" />
    </div>
  )
}

export function LandingPage() {
  useEffect(() => {
    const reveals = document.querySelectorAll('.landing-reveal')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('landing-reveal-visible')
            observer.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12 }
    )
    reveals.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="landing-root">
      {/* HERO */}
      <section className="landing-hero">
        <div className="landing-hero-left">
          <p className="landing-hero-eyebrow">A writing practice tool</p>
          <h1 className="landing-hero-title">
            Train Your
            <br />
            <em>Voice.</em>
            <br />
            Every Day.
          </h1>
          <p className="landing-hero-subtitle">
            Study passages from Eliot, Plath, Tolstoy, Woolf, Morrison, Hemingway, and more with
            AI-powered craft analysis. Write your own version, get feedback, and
            track your progress.
          </p>
          <div className="landing-hero-actions">
            <Link href="/lab" className="landing-btn-primary" id="start">
              Browse Passages
            </Link>
            <a href="#how" className="landing-btn-secondary">
              How it works
            </a>
          </div>
        </div>
        <div className="landing-hero-right">
          <div className="landing-manuscript-mock">
            <p className="landing-ms-label">Extract — Woolf</p>
            <p className="landing-ms-phase-header" style={{ marginBottom: '0.5rem' }}>
              Craft highlights — segments tagged by category, hover to read notes
            </p>
            <p className="landing-ms-passage">
              &quot;She had a{' '}
              <CraftTooltip note={MANUSCRIPT_NOTES.voice}>
                <span className="landing-ms-hl landing-ms-hl-voice">perpetual sense</span>
              </CraftTooltip>
              , as she{' '}
              <CraftTooltip note={MANUSCRIPT_NOTES.imagery}>
                <span className="landing-ms-hl landing-ms-hl-imagery">watched the taxi cabs</span>
              </CraftTooltip>
              , of being{' '}
              <CraftTooltip note={MANUSCRIPT_NOTES.structure}>
                <span className="landing-ms-hl landing-ms-hl-structure">out, out, far out</span>
              </CraftTooltip>
              {' '}to sea and{' '}
              <CraftTooltip note={MANUSCRIPT_NOTES.pacing}>
                <span className="landing-ms-hl landing-ms-hl-pacing">alone</span>
              </CraftTooltip>
              ...&quot;
            </p>
            <div className="landing-ms-legend">
              <span className="landing-ms-legend-item">
                <span className="landing-ms-legend-dot landing-ms-legend-structure" />
                Structure
              </span>
              <span className="landing-ms-legend-item">
                <span className="landing-ms-legend-dot landing-ms-legend-voice" />
                Voice
              </span>
              <span className="landing-ms-legend-item">
                <span className="landing-ms-legend-dot landing-ms-legend-imagery" />
                Imagery
              </span>
              <span className="landing-ms-legend-item">
                <span className="landing-ms-legend-dot landing-ms-legend-pacing" />
                Pacing
              </span>
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <p
                className="landing-ms-phase-header"
                style={{ marginBottom: '0.75rem' }}
              >
                Your exercise
              </p>
              <TypewriterExercise />
            </div>
          </div>
        </div>
      </section>

      {/* PHASES */}
      <section className="landing-phases" id="how">
        <div className="landing-section-header landing-reveal">
          <span className="landing-section-num">01 /</span>
          <h2 className="landing-section-title">
            Study, Write,
            <br />
            Improve
          </h2>
        </div>
        <div className="landing-phases-grid">
          <div className="landing-phase-card landing-reveal">
            <span className="landing-phase-num">01</span>
            <span className="landing-phase-icon">🔍</span>
            <h3 className="landing-phase-name">
              <em>Study</em> the Extract
            </h3>
            <p className="landing-phase-desc">
              AI-powered analysis highlights structure, voice, imagery, and pacing.
              Hover over segments to see craft notes. Understand what makes the
              passage work before you write.
            </p>
          </div>
          <div
            className="landing-phase-card landing-reveal"
            style={{ transitionDelay: '0.1s' }}
          >
            <span className="landing-phase-num">02</span>
            <span className="landing-phase-icon">✍️</span>
            <h3 className="landing-phase-name">
              Write <em>Your</em> Version
            </h3>
            <p className="landing-phase-desc">
              Each passage comes with hand-authored constraints — prompts that
              push you to think differently. Write your own take. Optionally hear
              it read aloud with ElevenLabs.
            </p>
          </div>
          <div
            className="landing-phase-card landing-reveal"
            style={{ transitionDelay: '0.2s' }}
          >
            <span className="landing-phase-num">03</span>
            <span className="landing-phase-icon">💬</span>
            <h3 className="landing-phase-name">
              Get <em>Feedback</em> &amp; Save
            </h3>
            <p className="landing-phase-desc">
              AI feedback on your writing. Save completions to your profile. Track
              your activity with a heatmap. Build a daily practice.
            </p>
          </div>
        </div>
      </section>

      {/* PASSAGES */}
      <section className="landing-passages">
        <div className="landing-section-header landing-reveal">
          <span className="landing-section-num">02 /</span>
          <h2 className="landing-section-title">9 Categories, 40+ Passages</h2>
        </div>
        <p
          className="landing-reveal"
          style={{
            fontFamily: 'var(--landing-mono)',
            fontSize: '0.98rem',
            color: 'rgba(245,240,232,0.7)',
            maxWidth: '55ch',
            lineHeight: 1.8,
          }}
        >
          Passages organized by craft: character intro, in medias res, place
          &amp; atmosphere, dialogue, interiority, time &amp; memory, rhythm
          &amp; style, tension &amp; dread, poetry. Filter by tags. Each one teaches
          something different.
        </p>
        <div
          className="landing-authors-list landing-reveal"
          style={{ transitionDelay: '0.15s' }}
        >
          <div className="landing-author-item">
            <p className="landing-author-name">Virginia Woolf</p>
            <p className="landing-author-note">Interiority</p>
          </div>
          <div className="landing-author-item">
            <p className="landing-author-name">Toni Morrison</p>
            <p className="landing-author-note">Weight &amp; Memory</p>
          </div>
          <div className="landing-author-item">
            <p className="landing-author-name">Ernest Hemingway</p>
            <p className="landing-author-note">Dialogue</p>
          </div>
          <div className="landing-author-item">
            <p className="landing-author-name">Raymond Carver</p>
            <p className="landing-author-note">Minimalism</p>
          </div>
          <span className="landing-author-more">and more</span>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="landing-how">
        <div className="landing-section-header landing-reveal">
          <span className="landing-section-num">03 /</span>
          <h2 className="landing-section-title">
            How It
            <br />
            Works
          </h2>
        </div>
        <div
          className="landing-steps landing-reveal"
          style={{ transitionDelay: '0.15s' }}
        >
          <div className="landing-step">
            <span className="landing-step-num">01</span>
            <div className="landing-step-body">
              <p className="landing-step-title">Browse &amp; pick a passage</p>
              <p className="landing-step-desc">
                Filter by category or tag. Each passage shows author, work, and
                context. Pick one that speaks to you.
              </p>
            </div>
          </div>
          <div className="landing-step">
            <span className="landing-step-num">02</span>
            <div className="landing-step-body">
              <p className="landing-step-title">Study the AI analysis</p>
              <p className="landing-step-desc">
                Claude annotates structure, voice, imagery, and pacing. Hover
                highlights to see craft notes. Understand before you write.
              </p>
            </div>
          </div>
          <div className="landing-step">
            <span className="landing-step-num">03</span>
            <div className="landing-step-body">
              <p className="landing-step-title">Write your version</p>
              <p className="landing-step-desc">
                Follow the constraint prompt. Optionally hear your text read
                aloud with ElevenLabs.
              </p>
            </div>
          </div>
          <div className="landing-step">
            <span className="landing-step-num">04</span>
            <div className="landing-step-body">
              <p className="landing-step-title">Get AI feedback</p>
              <p className="landing-step-desc">
                Submit your writing for analysis. See what works and what to
                improve.
              </p>
            </div>
          </div>
          <div className="landing-step">
            <span className="landing-step-num">05</span>
            <div className="landing-step-body">
              <p className="landing-step-title">Save &amp; track progress</p>
              <p className="landing-step-desc">
                Sign up to save completions to your profile. View your activity
                heatmap. Build a daily practice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <p className="landing-cta-tag landing-reveal">Free &amp; Open Source</p>
        <h2 className="landing-cta-title landing-reveal">
          Start
          <br />
          <em>Writing</em>
          <br />
          Today.
        </h2>
        <p className="landing-cta-sub landing-reveal">
          Proselab gives you AI-powered craft analysis, hand-authored
          constraints, and feedback. Study the masters. Write more.
        </p>
        <div className="landing-reveal landing-cta-buttons">
          <Link href="/lab" className="landing-btn-primary">
            Browse Passages →
          </Link>
          <Link href="/pricing" className="landing-btn-outline">
            View pricing →
          </Link>
          <Link href="/signup" className="landing-btn-outline">
            Create account →
          </Link>
        </div>
        <p className="landing-cta-badge landing-reveal">
          No account needed to browse — sign up to save your work
        </p>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="landing-footer-top">
          <span className="landing-footer-logo">Proselab</span>
          <span className="landing-footer-mono">
            Next.js 16 · React 19 · Supabase · Anthropic Claude · ElevenLabs
          </span>
          <a
            href="https://github.com/LucaLyon1/writinggym"
            target="_blank"
            rel="noopener noreferrer"
            className="landing-footer-mono"
            style={{ color: 'var(--landing-rust)' }}
          >
            GitHub ↗
          </a>
        </div>
        <div className="landing-footer-contact">
          <Link href="/privacy" className="landing-footer-mono">
            Privacy
          </Link>
          <Link href="/terms" className="landing-footer-mono">
            Terms
          </Link>
          <Link href="/cookies" className="landing-footer-mono">
            Cookies
          </Link>
          <Link href="/contact" className="landing-footer-mono">
            Contact
          </Link>
          <a href="mailto:contact@proselab.io" className="landing-footer-mono">
            contact@proselab.io
          </a>
          <a
            href="https://x.com/LucaSav_io"
            target="_blank"
            rel="noopener noreferrer"
            className="landing-footer-mono"
          >
            X ↗
          </a>
          <a
            href="https://substack.com/@lucasavio"
            target="_blank"
            rel="noopener noreferrer"
            className="landing-footer-mono"
          >
            Substack ↗
          </a>
        </div>
      </footer>
    </div>
  )
}
