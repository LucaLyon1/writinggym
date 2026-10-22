'use client'

/**
 * Instant-check steps, Duolingo style: choose the best version, spot the
 * faulty words, cut the superfluous ones, rebuild a sentence from tiles. Each widget keeps its own
 * state across retries (a wrong option stays greyed out, a selection stays),
 * and is remounted for each new step.
 */
import { useMemo, useState } from 'react'
import type { ChooseStep, CutStep, OrderStep, SpotStep } from '@/lib/drills'
import { assembleOrder, chooseOrder, chunksOf, cutResult, seededOrder, tapVerdict, tileText, type MoveQuality } from '@/lib/drill-moves'

/** Where the step stands: open for answers, waiting on a verdict, or resolved. */
export interface QuizState {
  locked: boolean
  /** The latest verdict on this step, if any. */
  quality?: MoveQuality
  /** The player asked to see the answer. */
  reveal: boolean
}

const passed = (q?: MoveQuality) => q === 'brilliant' || q === 'great' || q === 'good'

// ── Choose ──────────────────────────────────────────────────

export function ChooseWidget({
  step,
  state,
  attempt,
  onAnswer,
}: {
  step: ChooseStep
  state: QuizState
  /** Changes on each new play of the puzzle, so the right answer moves on a replay. */
  attempt: number
  onAnswer: (optionIndex: number, text: string) => void
}) {
  const order = useMemo(() => chooseOrder(step, attempt), [step, attempt])
  const [wrong, setWrong] = useState<number[]>([])
  const [picked, setPicked] = useState<number | null>(null)
  const done = passed(state.quality) || state.reveal

  function choose(i: number) {
    if (state.locked || done || wrong.includes(i)) return
    setPicked(i)
    if (!step.options[i].correct) setWrong((w) => [...w, i])
    onAnswer(i, fill(step, i))
  }

  return (
    <div className="dr-quiz">
      {step.prompt && <p className="dr-quiz-prompt">{step.prompt}</p>}
      <div className="dr-options">
        {order.map((i) => {
          const option = step.options[i]
          const isRight = option.correct && (done || picked === i)
          const isWrong = wrong.includes(i)
          return (
            <button
              key={i}
              type="button"
              className={`dr-option${isRight ? ' is-right' : ''}${isWrong ? ' is-wrong' : ''}${picked === i && !isRight && !isWrong ? ' is-picked' : ''}`}
              onClick={() => choose(i)}
              disabled={state.locked || done || isWrong}
            >
              {option.text}
              {isWrong && <span className="dr-option-why">{option.why}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * "The ___ road" + "rutted" gives "The rutted road". A blank glued to the
 * previous word ("stay___ she") takes punctuation as is and a word with a space.
 */
function fill(step: ChooseStep, i: number): string {
  const text = step.options[i].text
  if (!step.prompt?.includes('___')) return text
  const glued = /\S___/.test(step.prompt) && !/^[,.;:!?—–-]/.test(text)
  return step.prompt.replace('___', glued ? ` ${text}` : text)
}

// ── Spot ────────────────────────────────────────────────────

export function SpotWidget({
  step,
  state,
  onCheck,
}: {
  step: SpotStep
  state: QuizState
  onCheck: (selected: number[], text: string) => void
}) {
  const chunks = useMemo(() => chunksOf(step), [step])
  const [selected, setSelected] = useState<number[]>([])
  const [checked, setChecked] = useState<number[] | null>(null)
  const done = passed(state.quality) || state.reveal

  function toggle(i: number) {
    if (state.locked || done) return
    setChecked(null)
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))
  }

  function check() {
    setChecked(selected)
    onCheck(selected, chunks.map((c) => c.text).join(' '))
  }

  return (
    <div className="dr-quiz">
      <p className={`dr-spot${step.units === 'sentence' ? ' is-sentences' : ''}`}>
        {chunks.map((c, i) => {
          const isSelected = selected.includes(i)
          const verdict = done
            ? c.target
              ? ' is-right'
              : ''
            : checked?.includes(i)
              ? { right: ' is-right', neutral: '', wrong: ' is-wrong' }[tapVerdict(c, 'spot')]
              : ''
          return (
            <button
              key={i}
              type="button"
              className={`dr-token${isSelected ? ' is-selected' : ''}${verdict}`}
              onClick={() => toggle(i)}
              disabled={state.locked || done}
              aria-pressed={isSelected}
            >
              {c.text}
            </button>
          )
        })}
      </p>
      {!done && (
        <div className="dr-quiz-actions">
          <span className="dr-hint">{step.units === 'sentence' ? 'Tap the sentence, then check.' : 'Tap the words, then check.'}</span>
          <button type="button" className="dr-btn dr-btn-primary" onClick={check} disabled={state.locked || selected.length === 0}>
            Check
          </button>
        </div>
      )}
    </div>
  )
}

// ── Cut ─────────────────────────────────────────────────────

export function CutWidget({
  step,
  state,
  onCheck,
}: {
  step: CutStep
  state: QuizState
  onCheck: (cut: number[], text: string) => void
}) {
  const chunks = useMemo(() => chunksOf(step), [step])
  const [cut, setCut] = useState<number[]>([])
  const [checked, setChecked] = useState<number[] | null>(null)
  const done = passed(state.quality) || state.reveal
  // On "Show answer", strike exactly the words that had to go.
  const shownCut = state.reveal && !passed(state.quality) ? chunks.map((c, i) => (c.target ? i : -1)).filter((i) => i >= 0) : cut
  const result = cutResult(chunks, shownCut)

  function toggle(i: number) {
    if (state.locked || done) return
    setChecked(null)
    setCut((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))
  }

  return (
    <div className="dr-quiz">
      <p className="dr-spot dr-cut">
        {chunks.map((c, i) => {
          const isCut = shownCut.includes(i)
          const verdict = checked?.includes(i) && !done ? { right: ' is-right', neutral: '', wrong: ' is-wrong' }[tapVerdict(c, 'cut')] : ''
          return (
            <button
              key={i}
              type="button"
              className={`dr-token${isCut ? ' is-cut' : ''}${verdict}${done && c.target ? ' is-right' : ''}`}
              onClick={() => toggle(i)}
              disabled={state.locked || done}
              aria-pressed={isCut}
              aria-label={isCut ? `Restore “${c.core}”` : `Cut “${c.core}”`}
            >
              {c.text}
            </button>
          )
        })}
      </p>
      <p className={`dr-cut-result${done ? ' is-done' : ''}`} aria-live="polite">
        <span>{shownCut.length ? 'Your sentence' : 'Tap a word to cut it'}</span>
        {result}
      </p>
      {!done && (
        <div className="dr-quiz-actions">
          <button type="button" className="dr-btn dr-btn-ghost" onClick={() => { setCut([]); setChecked(null) }} disabled={state.locked || cut.length === 0}>
            Restore all
          </button>
          <button
            type="button"
            className="dr-btn dr-btn-primary"
            onClick={() => {
              setChecked(cut)
              onCheck(cut, result)
            }}
            disabled={state.locked || cut.length === 0}
          >
            Check
          </button>
        </div>
      )}
    </div>
  )
}

// ── Order ───────────────────────────────────────────────────

export function OrderWidget({
  step,
  state,
  onCheck,
}: {
  step: OrderStep
  state: QuizState
  onCheck: (picked: number[], text: string) => void
}) {
  const bank = useMemo(() => seededOrder(step.chunks.length, step.goal + step.chunks.join('')), [step])
  const [picked, setPicked] = useState<number[]>([])
  const done = passed(state.quality) || state.reveal
  const shown = state.reveal && !passed(state.quality) ? step.chunks.map((_, i) => i) : picked
  const full = picked.length === step.chunks.length

  function add(i: number) {
    if (state.locked || done || picked.includes(i)) return
    setPicked((p) => [...p, i])
  }

  function remove(i: number) {
    if (state.locked || done) return
    setPicked((p) => p.filter((x) => x !== i))
  }

  return (
    <div className="dr-quiz">
      <div className={`dr-built${done ? ' is-done' : ''}`} aria-live="polite">
        {shown.length === 0 ? (
          <span className="dr-hint">Tap the tiles in the best order.</span>
        ) : done ? (
          <span className="dr-built-text">{assembleOrder(step, shown)}</span>
        ) : (
          picked.map((i) => (
            <button key={i} type="button" className="dr-tile is-placed" onClick={() => remove(i)} disabled={state.locked}>
              {tileText(step, i)}
            </button>
          ))
        )}
      </div>
      {!done && (
        <>
          <div className="dr-bank">
            {bank.map((i) => (
              <button
                key={i}
                type="button"
                className={`dr-tile${picked.includes(i) ? ' is-used' : ''}`}
                onClick={() => add(i)}
                disabled={state.locked || picked.includes(i)}
              >
                {tileText(step, i)}
              </button>
            ))}
          </div>
          <div className="dr-quiz-actions">
            <button type="button" className="dr-btn dr-btn-ghost" onClick={() => setPicked([])} disabled={state.locked || picked.length === 0}>
              Clear
            </button>
            <button
              type="button"
              className="dr-btn dr-btn-primary"
              onClick={() => onCheck(picked, assembleOrder(step, picked))}
              disabled={state.locked || !full}
            >
              Check
            </button>
          </div>
        </>
      )}
    </div>
  )
}
