import { getSubject, getTechnique, isWritten, lessonIndex, stepsFor, type DrillSubject, type DrillTechnique, type RewriteStep, type WriteStep } from '@/lib/drills'
import { countWords } from '@/lib/prose-metrics'

export const MAX_SENTENCE_WORDS = 120
const MAX_PREVIOUS = 8

export interface WrittenMoveContext {
  technique: DrillTechnique
  move: WriteStep | RewriteStep
  moveIndex: number
  total: number
  subject?: DrillSubject
  seed?: string
  /** Earlier moves of the passage, the writer's own text. */
  previous: string[]
}

/**
 * Resolves the written move a request is about. Only catalog content and the
 * writer's earlier moves come out of it, so nothing else reaches the prompt.
 */
export function resolveWrittenMove(input: Record<string, unknown>): WrittenMoveContext | { error: string } {
  const technique = typeof input.techniqueId === 'string' ? getTechnique(input.techniqueId) : undefined
  const subjectId = typeof input.subjectId === 'string' ? input.subjectId : ''
  const moveIndex = typeof input.moveIndex === 'number' ? input.moveIndex : -1
  const drill = { techniqueId: technique?.id ?? '', subjectId, seed: '' }
  const isLesson = !!technique?.lessons && lessonIndex(drill) >= 0
  const subject = isLesson ? undefined : getSubject(subjectId)
  const steps = technique ? stepsFor(technique, drill) : []
  const move = steps[moveIndex]
  if (!technique || !move || !isWritten(move) || (!isLesson && !subject)) return { error: 'Unknown drill.' }

  const seed = subject && typeof input.seed === 'string' && subject.seeds.includes(input.seed) ? input.seed : subject?.seeds[0]
  const previous = Array.isArray(input.previous)
    ? input.previous.filter((p): p is string => typeof p === 'string').slice(-MAX_PREVIOUS)
    : []
  if (previous.some((p) => countWords(p) > MAX_SENTENCE_WORDS)) {
    return { error: `Keep each sentence under ${MAX_SENTENCE_WORDS} words.` }
  }
  return { technique, move, moveIndex, total: steps.length, subject, seed, previous }
}

/** The puzzle and the move, as the coach reads them. */
export function describeMove({ technique, move, moveIndex, total, subject, seed, previous }: WrittenMoveContext): string {
  const source = move.kind === 'rewrite' ? move.source : undefined
  return `PUZZLE
Technique: ${technique.name}. ${technique.instruction}
What success looks like: ${technique.criteria}
${subject ? `Subject: ${subject.name}: ${seed}` : ''}${technique.albalat ? `\nPrinciple (Albalat): ${technique.albalat.en}` : ''}

MOVE ${moveIndex + 1} OF ${total}
Goal of this move: ${move.goal}${source ? `\nOriginal sentence to rewrite: ${source}` : ''}

Earlier moves:
${previous.length ? previous.map((p, i) => `${i + 1}. ${p}`).join('\n') : '(none)'}`
}
