'use client'

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import posthog from 'posthog-js'
import { SidebarNav } from '@/components/AppSidebar'
import { useSidebar } from '@/components/SidebarContext'
import { useAuthModal } from '@/components/auth/AuthModal'
import {
  FAMILY_LABELS,
  FAMILY_ORDER,
  LEVEL_NAMES,
  MAX_STARS,
  PATH,
  SUBJECTS,
  TECHNIQUES,
  drawDrill,
  getSubject,
  getTechnique,
  isWritten,
  lessonIndex,
  nextPuzzle,
  puzzleLength,
  starsFor,
  stepsFor,
  suggestedTechnique,
  type Drill,
  type DrillMove,
} from '@/lib/drills'
import {
  QUALITY_INFO,
  checkMove,
  firstBrokenRule,
  quizHint,
  judgeChoose,
  judgeCut,
  judgeOrder,
  judgeSpot,
  parseMoveJudgement,
  passes,
  readPartialJudgement,
  revealAnswer,
  segmentSentence,
  type Hint,
  type WrittenHint,
  type MoveHighlight,
  type MoveQuality,
  type RuleCheck,
  type StepResult,
} from '@/lib/drill-moves'
import { playSound, type DrillSound } from '@/components/drills/sounds'
import { EMPTY_PROGRESS, loadProgress, recordPuzzle, saveProgress, type DrillProgress } from '@/components/drills/progress'
import { dailyDrill, dailyStreak, dayKey, isSameDrill, recordDaily } from '@/lib/drills-daily'
import { ChooseWidget, CutWidget, OrderWidget, SpotWidget, type QuizState } from '@/components/drills/QuizSteps'

type Tab = 'puzzle' | 'path' | 'library'

type MoveStatus = 'judging' | 'passed' | 'failed' | 'kept'

interface Move {
  id: number
  /** Index of the step this move answers. */
  step: number
  text: string
  status: MoveStatus
  quality?: MoveQuality
  headline?: string
  comment?: string
  highlights: MoveHighlight[]
  better?: string
  /** Teaching note: why the move falls short and how to fix it. */
  explain?: string
  /** True while the coach's comment is still streaming in. */
  streaming: boolean
  /** Judged instantly by a rule, without the coach. */
  instant: boolean
  /** The player asked for the solution of an instant step instead of answering. */
  revealed?: boolean
}

// Deterministic, so server and client render the same first puzzle.
const FIRST_DRILL: Drill = drawDrill({ techniqueId: PATH[0].id }, () => 0)

const isCommitted = (m: Move) => m.status === 'passed' || m.status === 'kept'

function Stars({ count }: { count: number }) {
  return (
    <span className="dr-stars" aria-label={`${count} of ${MAX_STARS} stars`}>
      {Array.from({ length: MAX_STARS }, (_, i) => (
        <span key={i} className={i < count ? 'is-on' : ''}>★</span>
      ))}
    </span>
  )
}

function Badge({ move }: { move: Move }) {
  if (move.revealed) {
    return (
      <span className="dr-badge is-revealed" aria-label="Solution shown" title="Solution shown">💡</span>
    )
  }
  if (!move.quality) {
    return (
      <span className="dr-badge is-judging" aria-label="Judging">
        <span className="dr-dots"><i /><i /><i /></span>
      </span>
    )
  }
  const info = QUALITY_INFO[move.quality]
  return (
    <span className={`dr-badge q-${move.quality}`} aria-label={info.label} title={info.label}>
      {info.symbol}
    </span>
  )
}

function BoardMove({ move, latest }: { move: Move; latest: boolean }) {
  const segments = segmentSentence(move.text, move.highlights)
  return (
    <span className={`dr-move${move.quality ? ` q-${move.quality}` : ' is-judging'}${latest ? ' is-latest' : ''}${latest && move.status === 'failed' ? ' is-failed' : ''}`}>
      {segments.map((seg, i) =>
        seg.highlight ? (
          <mark key={i} className={`dr-hl is-${seg.highlight.tone}`} title={seg.highlight.note}>
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
      <Badge move={move} />
    </span>
  )
}

function RuleChips({ checks }: { checks: RuleCheck[] }) {
  return (
    <div className="dr-chips" aria-live="polite">
      {checks.map((c, i) => (
        <span key={i} className={`dr-chip is-${c.status}`}>
          <span className="dr-chip-icon" aria-hidden>{c.status === 'ok' ? '✓' : c.status === 'fail' ? '✕' : '○'}</span>
          {c.label}
        </span>
      ))}
    </div>
  )
}

function Burst() {
  return (
    <span className="dr-burst" aria-hidden>
      {Array.from({ length: 12 }, (_, i) => (
        <i key={i} style={{ ['--a' as string]: `${i * 30}deg` }} />
      ))}
    </span>
  )
}

/** Using a hint caps the move at "good": it still passes, but it is not your own find. */
function capForHint(quality: MoveQuality, hinted: boolean): MoveQuality {
  return hinted && (quality === 'brilliant' || quality === 'great') ? 'good' : quality
}

function HintBox({
  hint,
  solution,
  loading,
  error,
  onUse,
}: {
  hint?: Hint
  solution?: string
  loading: boolean
  error: string | null
  onUse?: () => void
}) {
  if (!hint && !loading && !error) return null
  return (
    <div className="dr-hintbox" aria-live="polite">
      {loading && <p className="dr-shimmer">The coach is finding a way in…</p>}
      {error && <p className="dr-error" role="alert">{error}</p>}
      {hint && (
        <div className="dr-hintbox-item">
          <span>Hint</span>
          <p className="dr-hint-action">{hint.action}</p>
          {hint.why && <p className="dr-hint-why">{hint.why}</p>}
        </div>
      )}
      {solution && (
        <div className="dr-hintbox-item">
          <span>Possible solution</span>
          <p className="dr-hint-solution">{solution}</p>
          {onUse && (
            <button type="button" className="dr-btn dr-btn-ghost" onClick={onUse}>
              Write from it
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const KIND_LABELS: Record<NonNullable<DrillMove['kind']>, string> = {
  write: 'Write',
  rewrite: 'Rewrite',
  choose: 'Choose',
  spot: 'Spot',
  cut: 'Cut',
  order: 'Rebuild',
}

function kindOf(step: DrillMove): NonNullable<DrillMove['kind']> {
  return step.kind ?? 'write'
}

/** The formats a lesson scale uses, in the order they first appear: "Choose · Spot · Rewrite". */
function lessonFormats(lessons: DrillMove[][]): string {
  return [...new Set(lessons.flat().map((s) => KIND_LABELS[kindOf(s)]))].join(' · ')
}

/** The coach API needs an account: for a lapsed session the middleware redirects to /signup. */
function needsSignup(res: Response): boolean {
  return res.redirected && new URL(res.url).pathname === '/signup'
}

export default function DrillsPage() {
  const { open: sidebarOpen } = useSidebar()
  const { isAuthenticated, open: openAuth } = useAuthModal()

  /** Anonymous visitors can look around, but playing asks them to sign up first. */
  function requireAccount(): boolean {
    if (isAuthenticated) return true
    openAuth('signup', 'drills')
    return false
  }

  function gateClick(e: MouseEvent<HTMLElement>) {
    if (isAuthenticated || !(e.target as Element).closest('button')) return
    e.preventDefault()
    e.stopPropagation()
    openAuth('signup', 'drills')
  }
  const [tab, setTab] = useState<Tab>('puzzle')
  const [drill, setDrill] = useState<Drill>(FIRST_DRILL)
  const [puzzleKey, setPuzzleKey] = useState(0)
  const [moves, setMoves] = useState<Move[]>([])
  const [retried, setRetried] = useState<number[]>([])
  const [viewIndex, setViewIndex] = useState(0)
  const [input, setInput] = useState('')
  const [showBetter, setShowBetter] = useState(false)
  /** Help taken per step index: 1 after the hint, 2 after the possible solution. */
  const [hintLevels, setHintLevels] = useState<Record<number, number>>({})
  /** The coach's hints for written steps, per step index. */
  const [writtenHints, setWrittenHints] = useState<Record<number, WrittenHint>>({})
  const [hintLoading, setHintLoading] = useState(false)
  const [hintError, setHintError] = useState<{ step: number; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<DrillProgress>(EMPTY_PROGRESS)
  const [lastResult, setLastResult] = useState<{ clean: boolean; stars: number; streak: number; daily?: number } | null>(null)
  /** Today in the writer's time zone, known only after mount so server and client markup match. */
  const [today, setToday] = useState<string | null>(null)
  const [recordedKey, setRecordedKey] = useState(-1)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const stepRef = useRef<HTMLElement>(null)
  const puzzleRef = useRef(0)
  const nextId = useRef(0)
  const mutedRef = useRef(false)

  const technique = getTechnique(drill.techniqueId) ?? TECHNIQUES[0]
  const steps = stepsFor(technique, drill)
  const isLesson = !!technique.lessons && lessonIndex(drill) >= 0
  const subject = isLesson ? undefined : (getSubject(drill.subjectId) ?? SUBJECTS[0])
  const committed = moves.filter(isCommitted)
  const moveIndex = committed.length
  const complete = moveIndex >= steps.length
  const last = moves[moves.length - 1]
  const awaiting = last?.status === 'failed' || (last?.status === 'judging' && !last.quality)

  // Subject puzzles always show the next move; lessons show one step at a time until "Continue".
  const stepIndex = Math.min(isLesson ? viewIndex : moveIndex, steps.length - 1)
  const step = steps[stepIndex]
  const stepLast = [...moves].reverse().find((m) => m.step === stepIndex)
  const stepDone = !!stepLast && isCommitted(stepLast)
  const shown = isLesson ? stepLast : last
  const written = isWritten(step) ? step : null
  const previousTexts = isLesson ? [] : committed.map((m) => m.text)
  const checks = written ? checkMove(written.rules, input, previousTexts, written.sentences ?? 1) : []
  const showInput = written && (isLesson ? !stepDone && viewIndex < steps.length : !complete)
  const showSolved = complete && lastResult && (!isLesson || viewIndex >= steps.length)
  const suggested = suggestedTechnique(progress.solved)
  const hintLevel = hintLevels[stepIndex] ?? 0
  const hint: Hint | undefined = hintLevel === 0 ? undefined : written ? writtenHints[stepIndex] : quizHint(step as Parameters<typeof quizHint>[0], technique)
  const stepOpen = isLesson ? viewIndex < steps.length && !stepDone : !complete
  const daily = today ? dailyDrill(today) : null
  const isDaily = !!daily && isSameDrill(drill, daily)
  const dailyDone = !!today && progress.daily.day === today

  useEffect(() => {
    // Read browser-only progress after mount so server and client markup match.
    const stored = loadProgress()
    mutedRef.current = stored.muted
    setProgress(stored)
    setToday(dayKey())
    const first = suggestedTechnique(stored.solved)
    setDrill(drawDrill({ techniqueId: first.id, avoidSubjects: stored.solved[first.id] }))
  }, [])

  const sound = useCallback((s: DrillSound) => {
    if (!mutedRef.current) playSound(s)
  }, [])

  const updateMove = useCallback((id: number, patch: Partial<Move>) => {
    setMoves((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }, [])

  function startPuzzle(next: Drill) {
    puzzleRef.current += 1
    setPuzzleKey((k) => k + 1)
    setDrill(next)
    setMoves([])
    setRetried([])
    setViewIndex(0)
    setInput('')
    setError(null)
    setShowBetter(false)
    setHintLevels({})
    setWrittenHints({})
    setHintLoading(false)
    setHintError(null)
    setLastResult(null)
    setTab('puzzle')
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  // Close the puzzle once every move is in, the last comment has arrived,
  // and, in a lesson, the player has moved past the last step.
  useEffect(() => {
    if (!complete || moves.some((m) => m.streaming) || recordedKey === puzzleKey) return
    if (isLesson && viewIndex < steps.length) return
    setRecordedKey(puzzleKey)
    // Looking at a solution costs the star, like keeping a flawed move.
    const clean = moves.every((m) => m.status === 'passed') && !Object.values(hintLevels).some((l) => l >= 2)
    const solved = recordPuzzle(progress, drill.techniqueId, drill.subjectId, clean)
    // Finishing the daily puzzle counts for the day, clean or not: the habit is the point.
    const updated = isDaily && today ? { ...solved, daily: recordDaily(solved.daily, today) } : solved
    saveProgress(updated)
    setProgress(updated)
    setLastResult({
      clean,
      stars: starsFor(updated.solved, drill.techniqueId),
      streak: updated.streak,
      daily: isDaily && today ? dailyStreak(updated.daily, today) : undefined,
    })
    sound(clean ? 'solved' : 'inaccuracy')
    posthog.capture('drill_puzzle_completed', { technique: drill.techniqueId, subject: drill.subjectId, clean, daily: isDaily })
  }, [complete, moves, progress, drill, sound, recordedKey, puzzleKey, isLesson, viewIndex, steps.length, hintLevels, isDaily, today])

  /** Instant steps: the verdict is computed in the browser. */
  function playQuiz(judge: (firstTry: boolean) => StepResult, text: string) {
    if (awaiting || stepDone || !requireAccount()) return
    const result = judge(!retried.includes(stepIndex) && hintLevel === 0)
    const ok = passes(result.quality)
    sound(result.quality)
    if (!ok) setRetried((r) => (r.includes(stepIndex) ? r : [...r, stepIndex]))
    setShowBetter(false)
    setMoves((ms) => [
      ...ms,
      {
        id: nextId.current++,
        step: stepIndex,
        text,
        status: ok ? 'passed' : 'failed',
        quality: result.quality,
        headline: result.headline,
        comment: result.comment,
        explain: result.explain,
        highlights: [],
        streaming: false,
        instant: true,
      },
    ])
    posthog.capture('drill_move_played', { technique: drill.techniqueId, kind: kindOf(step), quality: result.quality, instant: true, hinted: hintLevel > 0 })
  }

  /** Written steps: instant rules first, then the coach. */
  async function playMove() {
    const text = input.trim()
    if (!text || !written || awaiting || complete || stepDone || !requireAccount()) return
    const broken = firstBrokenRule(checks)
    const id = nextId.current++
    const index = stepIndex
    const hinted = hintLevel > 0
    setInput('')
    setError(null)
    setShowBetter(false)

    if (broken) {
      // Instant verdict: a hard rule is unmet, no need to ask the coach.
      sound('mistake')
      setMoves((ms) => [
        ...ms,
        {
          id,
          step: index,
          text,
          status: 'failed',
          quality: 'mistake',
          headline: broken.reason,
          comment: broken.lesson ?? '',
          highlights: broken.hit ? [{ text: broken.hit, tone: 'bad', note: 'Breaks the rule' }] : [],
          streaming: false,
          instant: true,
        },
      ])
      posthog.capture('drill_move_played', { technique: drill.techniqueId, kind: kindOf(step), quality: 'mistake', instant: true })
      return
    }

    sound('place')
    setMoves((ms) => [...ms, { id, step: index, text, status: 'judging', highlights: [], streaming: true, instant: false }])
    const puzzle = puzzleRef.current
    const stale = () => puzzle !== puzzleRef.current

    try {
      const res = await fetch('/api/drills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...drill, moveIndex: index, previous: previousTexts, sentence: text }),
      })
      if (needsSignup(res)) {
        openAuth('login', 'drills')
        throw new Error('Sign in to keep playing.')
      }
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        throw new Error(typeof data.error === 'string' ? data.error : 'The coach is unavailable.')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let raw = ''
      let announced: MoveQuality | undefined
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        raw += decoder.decode(value, { stream: true })
        if (stale()) return
        const partial = readPartialJudgement(raw)
        if (partial.quality && !announced) {
          // The verdict lands as soon as it is streamed: badge, color and sound.
          announced = capForHint(partial.quality, hinted)
          sound(announced)
          updateMove(id, { quality: announced, status: passes(announced) ? 'passed' : 'failed' })
        }
        if (partial.headline) updateMove(id, { headline: partial.headline })
      }
      if (stale()) return

      const judgement = parseMoveJudgement(raw, text)
      const quality = judgement ? capForHint(judgement.quality, hinted) : announced
      if (!quality) throw new Error('The coach lost the thread. Play the move again.')
      if (!announced) sound(quality)

      updateMove(id, {
        quality,
        status: passes(quality) ? 'passed' : 'failed',
        headline: judgement?.headline ?? QUALITY_INFO[quality].label,
        comment: judgement?.comment ?? '',
        highlights: judgement?.highlights ?? [],
        better: judgement?.better ?? '',
        explain: judgement?.explanation || undefined,
        streaming: false,
      })
      posthog.capture('drill_move_played', { technique: drill.techniqueId, kind: kindOf(step), quality, instant: false, hinted })
    } catch (err) {
      if (stale()) return
      setMoves((ms) => ms.filter((m) => m.id !== id))
      setInput(text)
      setError(err instanceof Error ? err.message : 'Network error. Try again.')
    }
  }

  function retry() {
    if (!last || last.status !== 'failed') return
    setMoves((ms) => ms.slice(0, -1))
    // Written moves come back to the input to be edited; quiz widgets keep their own state.
    if (written) {
      setInput(last.text)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
    setShowBetter(false)
  }

  /** Accept a flawed move (written) or reveal the answer (quiz). No star either way. */
  function keep() {
    if (!last || last.status !== 'failed') return
    if (!written) {
      // "Show answer": replace the verdict with the answer and why it is right.
      const answer = revealAnswer(step as Parameters<typeof revealAnswer>[0])
      updateMove(last.id, { status: 'kept', headline: answer.headline, comment: answer.comment, explain: undefined })
    } else {
      updateMove(last.id, { status: 'kept' })
    }
    setShowBetter(false)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function continueLesson() {
    setViewIndex(moveIndex)
    setShowBetter(false)
    // Bring the next step into view (on phones the finished one can push it off screen).
    requestAnimationFrame(() => {
      stepRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      inputRef.current?.focus({ preventScroll: true })
    })
  }

  /** First level of help: one thing to do now. Written steps ask the coach. */
  async function showHint() {
    if (hintLevel > 0 || hintLoading || !requireAccount()) return
    const index = stepIndex
    posthog.capture('drill_hint_used', { technique: drill.techniqueId, kind: kindOf(step), level: 1 })
    if (!written || writtenHints[index]) {
      setHintLevels((h) => ({ ...h, [index]: 1 }))
      return
    }
    const puzzle = puzzleRef.current
    const stale = () => puzzle !== puzzleRef.current
    setHintLoading(true)
    setHintError(null)
    try {
      const res = await fetch('/api/drills/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...drill, moveIndex: index, previous: previousTexts }),
      })
      if (needsSignup(res)) {
        openAuth('login', 'drills')
        throw new Error('Sign in to keep playing.')
      }
      const data = await res.json().catch(() => ({}))
      if (stale()) return
      if (!res.ok || typeof data.action !== 'string' || typeof data.solution !== 'string') {
        throw new Error(typeof data.error === 'string' ? data.error : 'The coach is unavailable. Try again.')
      }
      setWrittenHints((h) => ({ ...h, [index]: { action: data.action, solution: data.solution } }))
      setHintLevels((h) => ({ ...h, [index]: 1 }))
    } catch (err) {
      if (!stale()) setHintError({ step: index, message: err instanceof Error ? err.message : 'Network error. Try again.' })
    } finally {
      if (!stale()) setHintLoading(false)
    }
  }

  /** Second level: a possible solution. The step still passes, but the puzzle earns no star. */
  function showSolution() {
    if (hintLevel !== 1) return
    setHintLevels((h) => ({ ...h, [stepIndex]: 2 }))
    posthog.capture('drill_hint_used', { technique: drill.techniqueId, kind: kindOf(step), level: 2 })
    if (written) return
    // An instant step has one answer: show it and close the step.
    const answer = revealAnswer(step as Parameters<typeof revealAnswer>[0])
    const revealed: Move = {
      id: nextId.current++,
      step: stepIndex,
      text: answer.headline,
      status: 'kept',
      headline: answer.headline,
      comment: answer.comment,
      highlights: [],
      streaming: false,
      instant: true,
      revealed: true,
    }
    setMoves((ms) => [...(ms[ms.length - 1]?.status === 'failed' ? ms.slice(0, -1) : ms), revealed])
    setShowBetter(false)
  }

  function writeFromSolution() {
    const solution = writtenHints[stepIndex]?.solution
    if (!solution) return
    setInput(solution)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function toggleMute() {
    const updated = { ...progress, muted: !progress.muted }
    mutedRef.current = updated.muted
    setProgress(updated)
    saveProgress(updated)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void playMove()
    }
  }

  const quizState: QuizState = {
    locked: awaiting || stepDone,
    quality: stepLast?.quality,
    reveal: stepLast?.status === 'kept',
  }
  const canContinue = isLesson && stepDone && viewIndex < steps.length
  // Wrong answers always come with a lesson: the step's own hint, the coach's
  // explanation, or, failing both, what the scale is looking for.
  const teaching =
    shown?.status === 'failed' && !shown.streaming
      ? (shown.explain ?? (shown.instant && written ? undefined : technique.criteria))
      : undefined
  const teachingNew = teaching !== hint?.why ? teaching : undefined
  const hintButton = !stepOpen ? null : hintLevel === 0 ? (
    <button type="button" className="dr-btn dr-btn-ghost dr-hint-btn" onClick={() => void showHint()} disabled={hintLoading} title="A hint caps this move at Good">
      💡 Hint
    </button>
  ) : hintLevel === 1 ? (
    <button type="button" className="dr-btn dr-btn-ghost dr-hint-btn" onClick={showSolution} title="Seeing a solution costs this puzzle its star">
      Possible solution
    </button>
  ) : null
  const hintBox = stepOpen ? (
    <HintBox
      hint={hint}
      solution={hintLevel >= 2 ? writtenHints[stepIndex]?.solution : undefined}
      loading={hintLoading}
      error={hintError?.step === stepIndex ? hintError.message : null}
      onUse={writeFromSolution}
    />
  ) : null

  const feedback = shown && !(isLesson && viewIndex >= steps.length) ? (
    <div className={`dr-feedback${shown.revealed ? ' is-revealed' : shown.quality ? ` q-${shown.quality}` : ' is-judging'}`} key={shown.id}>
      <span className="dr-feedback-icon" aria-hidden>{shown.revealed ? '💡' : shown.quality ? QUALITY_INFO[shown.quality].symbol : '…'}</span>
      <div className="dr-feedback-body">
        <p className="dr-feedback-title">
          {shown.revealed ? 'Solution' : shown.quality ? QUALITY_INFO[shown.quality].label : 'The coach is reading your move'}
          {shown.headline && (shown.quality || shown.revealed) && <span className="dr-feedback-headline">{shown.headline}</span>}
        </p>
        {shown.comment ? (
          <p className="dr-feedback-comment">{shown.comment}</p>
        ) : (
          shown.streaming && <p className="dr-feedback-comment dr-shimmer">Writing notes…</p>
        )}
        {teachingNew && (
          <div className="dr-feedback-why">
            <span>{shown.instant && !written ? 'What to look for' : 'How to fix it'}</span>
            <p>{teachingNew}</p>
          </div>
        )}
        {showBetter && shown.better && <p className="dr-better">{shown.better}</p>}
        <div className="dr-feedback-actions">
          {shown.status === 'failed' && (
            <>
              <button type="button" className="dr-btn dr-btn-primary" onClick={retry}>Retry</button>
              {shown.instant && !written ? (
                <button type="button" className="dr-btn dr-btn-ghost" onClick={keep}>Show answer</button>
              ) : (
                <>
                  {shown.better && !showBetter && (
                    <button type="button" className="dr-btn" onClick={() => setShowBetter(true)}>Show a stronger move</button>
                  )}
                  <button type="button" className="dr-btn dr-btn-ghost" onClick={keep}>Keep it</button>
                </>
              )}
            </>
          )}
          {shown.status === 'passed' && shown.better && !showBetter && !shown.streaming && (
            <button type="button" className="dr-btn dr-btn-ghost" onClick={() => setShowBetter(true)}>See another version</button>
          )}
          {canContinue && shown.id === stepLast?.id && (
            <button type="button" className="dr-btn dr-btn-primary" onClick={continueLesson} autoFocus>
              {moveIndex >= steps.length ? 'Finish' : 'Continue'}
            </button>
          )}
        </div>
      </div>
    </div>
  ) : null

  const solvedCard = showSolved ? (
    <div className={`dr-solved${lastResult.clean ? ' is-clean' : ''}`}>
      {lastResult.clean && <Burst />}
      <p className="dr-solved-kicker">{lastResult.daily !== undefined ? `Daily puzzle · ${technique.name}` : technique.name}</p>
      <h2 className="dr-solved-title">{lastResult.clean ? (isLesson ? 'Lesson complete!' : 'Puzzle solved!') : 'Puzzle complete'}</h2>
      <div className="dr-solved-moves">
        {moves.filter(isCommitted).map((m) => <Badge key={m.id} move={m} />)}
      </div>
      <p className="dr-solved-text">
        {lastResult.clean
          ? lastResult.stars >= MAX_STARS
            ? 'Every key played. This scale is yours.'
            : isLesson
              ? 'Star earned. The next lesson is waiting.'
              : `Star earned in ${subject?.name.toLowerCase()}. Play it in another subject to earn the next.`
          : 'You kept a flawed move or looked at a solution, so no star this time. Replay it clean.'}
        {lastResult.daily !== undefined && ' Today’s puzzle is done. A new one comes tomorrow.'}
      </p>
      <div className="dr-solved-meta">
        <Stars count={lastResult.stars} />
        <span className="dr-streak" title="Clean puzzles in a row">🔥 {lastResult.streak}</span>
        {lastResult.daily !== undefined && (
          <span className="dr-streak" title="Days in a row with the daily puzzle done">📅 {lastResult.daily}</span>
        )}
      </div>
      <div className="dr-solved-actions">
        <button type="button" className="dr-btn dr-btn-primary dr-btn-big" onClick={() => startPuzzle(nextPuzzle(drill, progress.solved))} autoFocus>
          Next puzzle
        </button>
        <button type="button" className="dr-btn" onClick={() => startPuzzle(drill)}>Replay</button>
      </div>
    </div>
  ) : null

  const inputArea = showInput ? (
    <section className="dr-play">
      {!isLesson && (
        <div className="dr-play-head">
          <span className="dr-move-count">Move {moveIndex + 1} of {steps.length}</span>
          <span className="dr-goal">{step.goal}</span>
          {hintButton}
        </div>
      )}
      {!isLesson && hintBox}
      <textarea
        ref={inputRef}
        className="dr-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={
          awaiting
            ? last?.status === 'failed'
              ? 'Retry or keep your move to continue.'
              : 'The coach is reading…'
            : written?.kind === 'rewrite'
              ? 'Write your version, then press Enter.'
              : (written?.sentences ?? 1) > 1
                ? 'Write your move, then press Enter.'
                : 'Write one sentence, then press Enter.'
        }
        disabled={awaiting}
        rows={3}
        spellCheck
      />
      <div className="dr-play-foot">
        <RuleChips checks={checks} />
        <button type="button" className="dr-btn dr-btn-primary" onClick={() => void playMove()} disabled={!input.trim() || awaiting}>
          Play move ⏎
        </button>
      </div>
      {error && <p className="dr-error" role="alert">{error}</p>}
    </section>
  ) : null

  const stepCard = isLesson && viewIndex < steps.length ? (
    <section className="dr-stepcard" key={`${puzzleKey}-${stepIndex}`} ref={stepRef}>
      <div className="dr-step-head">
        <span className="dr-move-count">{KIND_LABELS[kindOf(step)]} · {stepIndex + 1} of {steps.length}</span>
        {hintButton}
      </div>
      <h2 className="dr-step-goal">{step.goal}</h2>
      {hintBox}
      {step.kind === 'choose' && (
        <ChooseWidget step={step} state={quizState} attempt={puzzleKey} onAnswer={(i, text) => playQuiz((first) => judgeChoose(step, i, first), text)} />
      )}
      {step.kind === 'spot' && (
        <SpotWidget step={step} state={quizState} onCheck={(sel, text) => playQuiz((first) => judgeSpot(step, sel, first), text)} />
      )}
      {step.kind === 'cut' && (
        <CutWidget step={step} state={quizState} onCheck={(cut, text) => playQuiz((first) => judgeCut(step, cut, first), text)} />
      )}
      {step.kind === 'order' && (
        <OrderWidget step={step} state={quizState} onCheck={(picked, text) => playQuiz((first) => judgeOrder(step, picked, first), text)} />
      )}
      {step.kind === 'rewrite' && (
        <p className="dr-source">
          <span>Original</span>
          {step.source}
        </p>
      )}
      {written && stepLast && (
        <p className="dr-board-text dr-step-answer">
          <BoardMove move={stepLast} latest />
        </p>
      )}
    </section>
  ) : null

  const board = !isLesson ? (
    <section className={`dr-board${moves.length ? '' : ' is-empty'}`} aria-label="Your passage">
      {moves.length === 0 ? (
        <p className="dr-board-empty">Your passage builds here, one move at a time.</p>
      ) : (
        <p className="dr-board-text">
          {moves.map((m, i) => (
            <BoardMove key={m.id} move={m} latest={i === moves.length - 1} />
          ))}
        </p>
      )}
    </section>
  ) : null

  const puzzle = (
    <div className="dr-center">
      <header className="dr-head">
        <div className="dr-head-top">
          <span className="dr-kicker">
            {isDaily ? 'Daily puzzle · ' : ''}
            {FAMILY_LABELS[technique.family]} · {LEVEL_NAMES[technique.level]}
          </span>
          <div className="dr-head-tools">
            <span className="dr-streak" title="Clean puzzles in a row">🔥 {progress.streak}</span>
            <button type="button" className="dr-icon-btn" onClick={toggleMute} aria-label={progress.muted ? 'Unmute sounds' : 'Mute sounds'}>
              {progress.muted ? '🔇' : '🔊'}
            </button>
            <button
              type="button"
              className="dr-btn dr-btn-ghost"
              onClick={() => startPuzzle(drawDrill({ techniqueId: drill.techniqueId, avoidSeed: drill.seed, avoidSubjects: [drill.subjectId] }))}
            >
              Skip
            </button>
          </div>
        </div>
        <h1 className="dr-title">{technique.name}</h1>
        <p className="dr-instruction">{technique.instruction}</p>
        {isLesson ? (
          <p className="dr-subject"><span>Lesson</span>{lessonIndex(drill) + 1} of {technique.lessons?.length}</p>
        ) : (
          <p className="dr-subject"><span>{subject?.name}</span>{drill.seed}</p>
        )}
      </header>

      {board}
      {stepCard}
      {!isLesson && feedback}
      {isLesson && inputArea}
      {isLesson && feedback}
      {solvedCard}
      {!isLesson && inputArea}
    </div>
  )

  const dailyTechnique = daily ? getTechnique(daily.techniqueId) : undefined
  const dailyDays = today ? dailyStreak(progress.daily, today) : 0
  const dailyCard =
    daily && dailyTechnique ? (
      <section className="dr-path-level">
        <h2 className="dr-path-title">Today</h2>
        <button type="button" className={`dr-node ${dailyDone ? 'is-done' : 'is-next'}`} onClick={() => startPuzzle(daily)}>
          <span className="dr-node-dot" aria-hidden>{dailyDone ? '✓' : '☀'}</span>
          <span className="dr-node-body">
            <span className="dr-node-name">Daily puzzle: {dailyTechnique.name}</span>
            <span className="dr-node-family">
              {FAMILY_LABELS[dailyTechnique.family]} · {LEVEL_NAMES[dailyTechnique.level]}
              {dailyDays > 0 && ` · 📅 ${dailyDays} ${dailyDays === 1 ? 'day' : 'days'} in a row`}
            </span>
          </span>
          <span className="dr-node-next">{dailyDone ? 'Done' : 'Play'}</span>
        </button>
      </section>
    ) : null

  const path = (
    <div className="dr-center">
      <header className="dr-head">
        <span className="dr-kicker">Suggested path</span>
        <h1 className="dr-title">Your scales</h1>
        <p className="dr-instruction">
          Earn a star by solving a scale cleanly in a subject or a lesson. Three stars and it becomes automatic. Follow the path or jump anywhere.
        </p>
      </header>
      {dailyCard}
      {([1, 2, 3] as const).map((level) => (
        <section key={level} className="dr-path-level">
          <h2 className="dr-path-title">Level {level} · {LEVEL_NAMES[level]}</h2>
          <ol className="dr-path">
            {PATH.filter((t) => t.level === level).map((t) => {
              const stars = starsFor(progress.solved, t.id)
              const state = stars >= MAX_STARS ? 'is-done' : t.id === suggested.id ? 'is-next' : ''
              return (
                <li key={t.id}>
                  <button type="button" className={`dr-node ${state}`} onClick={() => startPuzzle(drawDrill({ techniqueId: t.id, avoidSubjects: progress.solved[t.id] }))}>
                    <span className="dr-node-dot" aria-hidden>{stars >= MAX_STARS ? '✓' : PATH.indexOf(t) + 1}</span>
                    <span className="dr-node-body">
                      <span className="dr-node-name">{t.name}</span>
                      <span className="dr-node-family">
                        {FAMILY_LABELS[t.family]} · {t.lessons ? `${t.lessons.length} lessons` : `${puzzleLength(t)} ${puzzleLength(t) === 1 ? 'move' : 'moves'}`}
                      </span>
                    </span>
                    {state === 'is-next' && <span className="dr-node-next">Up next</span>}
                    <Stars count={stars} />
                  </button>
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </div>
  )

  const library = (
    <div className="dr-center">
      <header className="dr-head">
        <span className="dr-kicker">Library</span>
        <h1 className="dr-title">Every scale</h1>
        <p className="dr-instruction">Pick any scale to play it now.</p>
      </header>
      {FAMILY_ORDER.map((f) => (
        <section key={f} className="dr-family">
          <h2 className="dr-path-title">{FAMILY_LABELS[f]}</h2>
          <div className="dr-cards">
            {TECHNIQUES.filter((t) => t.family === f).map((t) => (
              <button key={t.id} type="button" className="dr-card" onClick={() => startPuzzle(drawDrill({ techniqueId: t.id, avoidSubjects: progress.solved[t.id] }))}>
                <span className="dr-card-head">
                  <span className="dr-card-name">{t.name}</span>
                  <Stars count={starsFor(progress.solved, t.id)} />
                </span>
                <span className="dr-card-text">{t.instruction}</span>
                <span className="dr-card-example">
                  {t.example}
                  {t.exampleSource && <span className="dr-card-source">{t.exampleSource}</span>}
                </span>
                {t.lessons && <span className="dr-card-tag">{lessonFormats(t.lessons)}</span>}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )

  return (
    <div className="analysis-view dr-page">
      <div className="ea-root">
        <div className="ea-page-layout">
          <aside className={`ea-left-sidebar${sidebarOpen ? ' is-open' : ''}`}>
            <nav className="ea-left-nav" aria-label="Drills sections">
              {(['puzzle', 'path', 'library'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`ea-left-nav-btn${tab === t && !(t === 'puzzle' && isDaily) ? ' is-active' : ''}`}
                  onClick={() => setTab(t)}
                >
                  {t === 'puzzle' ? 'Puzzle' : t === 'path' ? 'Path' : 'Library'}
                </button>
              ))}
              {daily && (
                <button
                  type="button"
                  className={`ea-left-nav-btn${tab === 'puzzle' && isDaily ? ' is-active' : ''}`}
                  onClick={() => (isDaily ? setTab('puzzle') : startPuzzle(daily))}
                >
                  {dailyDone ? 'Daily ✓' : 'Daily'}
                </button>
              )}
            </nav>
            <SidebarNav />
          </aside>
          <main className="ea-center-col dr-scroll" onClickCapture={gateClick}>{tab === 'puzzle' ? puzzle : tab === 'path' ? path : library}</main>
          <aside className="ea-right-col" aria-label="Moves and coach notes">
            <section className="dr-panel">
              <h3 className="dr-panel-title">{isLesson ? 'Steps' : 'Moves'}</h3>
              <ol className="dr-movelist">
                {steps.map((s, i) => {
                  const pendingHere = i === moveIndex && last && !isCommitted(last) ? last : undefined
                  const played = committed[i] ?? pendingHere
                  const current = isLesson ? i === stepIndex && viewIndex < steps.length : i === moveIndex && !complete
                  return (
                    <li key={i} className={`dr-movelist-item${current ? ' is-current' : ''}`}>
                      <span className="dr-movelist-num">{i + 1}</span>
                      <span className="dr-movelist-goal">{s.goal}</span>
                      {played ? <Badge move={played} /> : <span className="dr-badge is-empty" />}
                    </li>
                  )
                })}
              </ol>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
