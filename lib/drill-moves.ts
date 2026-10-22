/**
 * Moves: the unit of a drill puzzle. One move is one sentence.
 * Instant rule checks run in the browser; the AI annotates the move like a
 * chess engine (brilliant, great, good, inaccuracy, mistake, blunder).
 */
import type { ChooseStep, CutStep, DrillTechnique, MoveRule, OrderStep, SpotStep } from './drills'
import { countWords, findAdverbs, findPassive, splitSentences } from './prose-metrics'
import { TECHNIQUES } from './drills'

export const MOVE_QUALITIES = ['brilliant', 'great', 'good', 'inaccuracy', 'mistake', 'blunder'] as const
export type MoveQuality = (typeof MOVE_QUALITIES)[number]

export const QUALITY_INFO: Record<MoveQuality, { symbol: string; label: string; passes: boolean }> = {
  brilliant: { symbol: '!!', label: 'Brilliant', passes: true },
  great: { symbol: '!', label: 'Great move', passes: true },
  good: { symbol: '✓', label: 'Good move', passes: true },
  inaccuracy: { symbol: '?!', label: 'Inaccuracy', passes: false },
  mistake: { symbol: '?', label: 'Mistake', passes: false },
  blunder: { symbol: '??', label: 'Blunder', passes: false },
}

export function passes(quality: MoveQuality): boolean {
  return QUALITY_INFO[quality].passes
}

// ── Instant rule checks ─────────────────────────────────────

export type RuleStatus = 'ok' | 'pending' | 'fail'

export interface RuleCheck {
  label: string
  status: RuleStatus
  /** Shown when the move is played with this rule unmet. */
  reason: string
  /** The offending words, highlighted on the board. */
  hit?: string
  /** Why the rule exists and how to fix a break, shown when the move fails on it. */
  lesson?: string
}

/** The principle behind each instant rule, taught when a move breaks it. */
const RULE_LESSONS: Record<MoveRule['kind'] | 'sentences', string> = {
  sentences:
    'One move, one sentence: it keeps your attention on a single technique. Join your ideas with a comma or a conjunction, or keep only the strongest.',
  maxWords:
    'The limit forces a choice. Keep the words that carry meaning and drop the ones that only fill space: hedges, repeats, “there is”, “in order to”.',
  minWords:
    'This move needs room. Add a detail, a second action or a clause that builds, not filler words.',
  noPassive:
    'In the passive, the doer disappears or comes last. Put the doer first and make it act: “The wind broke the window”, not “The window was broken”.',
  noAdverbs:
    'An -ly adverb often props up a weak verb. Find the verb that already contains the manner: “ran quickly” becomes “sprinted”, “said angrily” becomes “snapped”.',
  noToBe:
    '“To be” only says that something exists. An action verb shows it doing something: “The room was cold” becomes “Cold seeped up from the tiles”.',
  contains: 'This scale trains one punctuation mark, so the move has to use it.',
  sameOpener: 'Anaphora works by repeating the exact same opening. Change one word and the echo breaks.',
  conjunctions: 'Polysyndeton needs the conjunctions to pile up, “and… and… and”, so the series slows down and gains weight.',
  noRepeats:
    'The reader hears the echo. Use a pronoun, cut the second mention, or rebuild the sentence so the word appears once. Swapping in a synonym only hides the problem.',
  noCliches:
    'A stock phrase is someone else’s thought, worn smooth: the reader slides over it. Ask what you actually see or feel here, and say exactly that.',
  noFiller:
    'Fillers like “very” and “really” prop up weak words. Cut them, or replace the pair with one stronger word: “very tired” becomes “exhausted”.',
  noJingle:
    'Words with the same ending chime like a rhyme. Turn some nouns back into verbs: “the implementation of the regulation” becomes “applying the rule”.',
  noEmotionWords:
    'Naming the feeling does the reader’s work for them, and they feel nothing. Show what the person does, what their body does, or what they notice: “She was angry” becomes “She set his plate down too hard.”',
}

const TO_BE = /\b(am|is|are|was|were|be|been|being|i'm|you're|we're|they're|he's|she's|it's|that's|there's)\b/i
const MARKS = {
  semicolon: { re: /;/, label: 'Semicolon' },
  colon: { re: /:/, label: 'Colon' },
  dash: { re: /—|–|\s-\s|--/, label: 'Dash' },
}

const STOPWORDS = new Set(
  (
    'the a an as if and or but nor so yet for of to in on at by with from into onto over under about after before ' +
    'than then that this these those there here what which who whom whose when where while because though ' +
    'although his her hers him he she it its they them their theirs we us our you your i me my mine was were ' +
    'is are be been being have has had do does did not no yes all any each some such very more most just also ' +
    'only once like would could should will shall might must can may out up down off again'
  ).split(' ')
)

/** Stock phrases, matched as whole phrases. Kept short and unambiguous. */
const CLICHES: RegExp[] = [
  /at the end of the day/, /heart of gold/, /cold as ice/, /crystal clear/, /piercing (blue )?eyes/,
  /(chill|shiver)s? (ran |went )?down (his|her|my|their|your) spine/, /time stood still/, /deafening silence/,
  /silence was deafening/, /raven(-| )hair/, /pitch(-| )black/, /dead of (the )?night/, /tears streamed/,
  /heart (was )?pounding/, /heart skipped a beat/, /blood ran cold/, /butterflies in (his|her|my|their|your) stomach/,
  /breath (he|she|i|they|you) didn'?t know/, /calm before the storm/, /fit as a fiddle/, /busy as a bee/,
  /white as a sheet/, /light as a feather/, /quiet as a mouse/, /like the plague/, /in the nick of time/,
  /all of a sudden/, /last but not least/, /only time will tell/, /every fib(er|re) of/, /sea of faces/,
  /lit up the room/, /rooted to the spot/, /frozen (in|with) fear/, /twinkle in (his|her|their) eyes?/,
  /weight of the world/, /on cloud nine/, /over the moon/, /tip of the iceberg/, /azure sky/, /emerald eyes/,
  /ruby lips/, /dark and stormy night/, /hear a pin drop/, /diamond in the rough/, /rough around the edges/,
  /eyes met across/, /crowded room/, /nipped? in the bud/, /hit the ground running/, /breath of fresh air/,
  /glowing orb/, /as old as time/, /like a drum/, /in the blink of an eye/, /stood the test of time/,
  /silent as the grave/, /crack of dawn/, /rock and a hard place/, /pale as a ghost/, /white as (freshly fallen )?snow/, /nick of time/,
]

const FILLERS = /\b(very|really|quite|just|actually|basically|literally|totally|extremely|somewhat|rather|simply|truly|definitely|certainly)\b/i

const JINGLE_ENDINGS = ['tion', 'sion', 'ment', 'ing', 'ly', 'ness', 'ity']

/** Words that name an emotion outright. Kept to clear cases, so a plain verb like “fear” as in “I fear the stairs” is rare noise. */
const EMOTION_WORDS =
  /\b(sad|sadness|unhappy|happy|happiness|angry|anger|furious|fury|rage|afraid|scared|frightened|terrified|terror|fear|fearful|nervous|anxious|anxiety|worried|jealous|jealousy|envious|ashamed|shame|guilty|guilt|embarrassed|lonely|loneliness|excited|relieved|relief|depressed|upset|miserable|joy|joyful|overjoyed|delighted|grief|heartbroken|disappointed|disappointment|frustrated|annoyed|hopeless|panicked)\b/i

function contentWords(text: string): string[] {
  return (text.toLowerCase().match(/[a-z’']+/g) ?? [])
    .map((w) => w.replace(/[’']s$/, '').replace(/[’']/g, "'"))
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w))
}

function firstWord(text: string): string {
  return (text.toLowerCase().match(/[a-z’']+/) ?? [''])[0]
}

function checkRule(rule: MoveRule, text: string, previous: string[]): RuleCheck {
  const words = countWords(text)
  switch (rule.kind) {
    case 'maxWords':
      return {
        label: `≤ ${rule.n} words · ${words}`,
        status: words === 0 ? 'pending' : words <= rule.n ? 'ok' : 'fail',
        reason: `Too long: ${words} words, the limit is ${rule.n}.`,
      }
    case 'minWords':
      return {
        label: `${rule.n}+ words · ${words}`,
        status: words >= rule.n ? 'ok' : 'pending',
        reason: `Too short: ${words} words, you need ${rule.n}.`,
      }
    case 'noPassive': {
      const hit = findPassive(text)[0]
      return {
        label: hit ? `Passive: “${hit}”` : 'No passive',
        status: hit ? 'fail' : words ? 'ok' : 'pending',
        reason: `Passive voice: “${hit}”. Make the subject act.`,
        hit,
      }
    }
    case 'noAdverbs': {
      const hit = findAdverbs(text)[0]
      return {
        label: hit ? `Adverb: “${hit}”` : 'No -ly adverbs',
        status: hit ? 'fail' : words ? 'ok' : 'pending',
        reason: `Adverb: “${hit}”. Find a verb that does its job.`,
        hit,
      }
    }
    case 'noToBe': {
      const hit = text.match(TO_BE)?.[0]
      return {
        label: hit ? `“To be”: “${hit}”` : 'No “to be”',
        status: hit ? 'fail' : words ? 'ok' : 'pending',
        reason: `“${hit}” is a form of “to be”. Replace it with an action.`,
        hit,
      }
    }
    case 'contains': {
      const mark = MARKS[rule.mark]
      const ok = mark.re.test(text)
      return { label: mark.label, status: ok ? 'ok' : 'pending', reason: `This move needs a ${mark.label.toLowerCase()}.` }
    }
    case 'sameOpener': {
      const target = firstWord(previous[previous.length - 1] ?? '')
      const mine = firstWord(text)
      return {
        label: target ? `Starts with “${target}”` : 'Same opener',
        status: !mine ? 'pending' : mine === target ? 'ok' : words > 1 ? 'fail' : 'pending',
        reason: `Start with “${target}” like the previous sentence.`,
      }
    }
    case 'noRepeats': {
      const seen = new Set<string>()
      const hit = contentWords(text).find((w) => (seen.has(w) ? true : (seen.add(w), false)))
      return {
        label: hit ? `Repeated: “${hit}”` : 'No repeated word',
        status: hit ? 'fail' : words ? 'ok' : 'pending',
        reason: `“${hit}” appears twice. Say it once, or rebuild the sentence.`,
        hit,
      }
    }
    case 'noCliches': {
      const lower = text.toLowerCase().replace(/’/g, "'")
      const match = CLICHES.map((re) => lower.match(re)?.[0]).find(Boolean)
      return {
        label: match ? `Cliché: “${match}”` : 'No cliché',
        status: match ? 'fail' : words ? 'ok' : 'pending',
        reason: `“${match}” is a stock phrase. Say it your own way.`,
        hit: match,
      }
    }
    case 'noFiller': {
      const hit = text.match(FILLERS)?.[0]
      return {
        label: hit ? `Filler: “${hit}”` : 'No filler words',
        status: hit ? 'fail' : words ? 'ok' : 'pending',
        reason: `“${hit}” is filler. Cut it, or find a stronger word.`,
        hit,
      }
    }
    case 'noJingle': {
      const all = text.toLowerCase().match(/[a-z]+/g) ?? []
      const ending = JINGLE_ENDINGS.find((e) => all.filter((w) => w.length > e.length + 2 && w.endsWith(e)).length >= 3)
      const hit = ending ? all.find((w) => w.length > ending.length + 2 && w.endsWith(ending)) : undefined
      return {
        label: ending ? `Jingle: “-${ending}” ×3` : 'No jingle',
        status: ending ? 'fail' : words ? 'ok' : 'pending',
        reason: `Three or more words end in “-${ending}”. The sentence sings when it should speak.`,
        hit,
      }
    }
    case 'noEmotionWords': {
      const hit = text.match(EMOTION_WORDS)?.[0]
      return {
        label: hit ? `Named: “${hit}”` : 'No named emotion',
        status: hit ? 'fail' : words ? 'ok' : 'pending',
        reason: `“${hit}” names the feeling. Show it instead.`,
        hit,
      }
    }
    case 'conjunctions': {
      const n = (text.match(/\b(and|or|nor)\b/gi) ?? []).length
      return {
        label: `${rule.n}+ “and” · ${n}`,
        status: n >= rule.n ? 'ok' : 'pending',
        reason: `Only ${n} conjunction${n === 1 ? '' : 's'}. Chain at least ${rule.n}.`,
      }
    }
  }
}

/** A move has a sentence limit (one by default), plus the step's own rules. */
export function checkMove(rules: MoveRule[] = [], text: string, previous: string[] = [], maxSentences = 1): RuleCheck[] {
  const sentences = splitSentences(text).length
  const limit: RuleCheck = {
    lesson: RULE_LESSONS.sentences,
    label: maxSentences === 1 ? 'One sentence' : `Up to ${maxSentences} sentences`,
    status: sentences === 0 ? 'pending' : sentences <= maxSentences ? 'ok' : 'fail',
    reason:
      maxSentences === 1
        ? `That is ${sentences} sentences. A move is exactly one.`
        : `That is ${sentences} sentences. This move allows ${maxSentences}.`,
  }
  return [limit, ...rules.map((r) => ({ ...checkRule(r, text, previous), lesson: RULE_LESSONS[r.kind] }))]
}

/** The first unmet rule, which makes the move an instant mistake. */
export function firstBrokenRule(checks: RuleCheck[]): RuleCheck | undefined {
  return checks.find((c) => c.status !== 'ok')
}

// ── AI annotation ───────────────────────────────────────────

export interface MoveHighlight {
  text: string
  tone: 'good' | 'bad'
  note: string
}

export interface MoveJudgement {
  quality: MoveQuality
  headline: string
  comment: string
  highlights: MoveHighlight[]
  better: string
  /** A short lesson on the principle behind the fix; empty when the move passes. */
  explanation: string
}

/** JSON schema for structured outputs. */
export const MOVE_JUDGEMENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['quality', 'headline', 'comment', 'highlights', 'better', 'explanation'],
  properties: {
    quality: { type: 'string', enum: [...MOVE_QUALITIES] },
    headline: { type: 'string' },
    comment: { type: 'string' },
    highlights: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['text', 'tone', 'note'],
        properties: {
          text: { type: 'string' },
          tone: { type: 'string', enum: ['good', 'bad'] },
          note: { type: 'string' },
        },
      },
    },
    better: { type: 'string' },
    explanation: { type: 'string' },
  },
} as const

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

/** Validates the judge's JSON. Drops highlights that are not in the sentence. */
export function parseMoveJudgement(raw: string, sentence: string): MoveJudgement | null {
  let data: Record<string, unknown>
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (!data || typeof data !== 'object') return null
  const quality = MOVE_QUALITIES.find((q) => q === data.quality)
  if (!quality) return null

  const lower = sentence.toLowerCase()
  const highlights = Array.isArray(data.highlights)
    ? data.highlights
        .filter((h): h is Record<string, unknown> => !!h && typeof h === 'object')
        .map((h) => ({ text: str(h.text), tone: h.tone === 'bad' ? ('bad' as const) : ('good' as const), note: str(h.note) }))
        .filter((h) => h.text && lower.includes(h.text.toLowerCase()))
        .slice(0, 4)
    : []

  return {
    quality,
    headline: str(data.headline) || QUALITY_INFO[quality].label,
    comment: str(data.comment),
    highlights,
    better: str(data.better),
    explanation: passes(quality) ? '' : str(data.explanation),
  }
}

export interface Segment {
  text: string
  highlight?: MoveHighlight
}

/** Splits a sentence into plain and highlighted segments, first match wins, no overlaps. */
export function segmentSentence(sentence: string, highlights: MoveHighlight[]): Segment[] {
  const lower = sentence.toLowerCase()
  const ranges: { start: number; end: number; h: MoveHighlight }[] = []
  for (const h of highlights) {
    const start = lower.indexOf(h.text.toLowerCase())
    if (start < 0) continue
    const end = start + h.text.length
    if (ranges.some((r) => start < r.end && end > r.start)) continue
    ranges.push({ start, end, h })
  }
  ranges.sort((a, b) => a.start - b.start)
  const segments: Segment[] = []
  let cursor = 0
  for (const r of ranges) {
    if (r.start > cursor) segments.push({ text: sentence.slice(cursor, r.start) })
    segments.push({ text: sentence.slice(r.start, r.end), highlight: r.h })
    cursor = r.end
  }
  if (cursor < sentence.length) segments.push({ text: sentence.slice(cursor) })
  return segments
}

/** Reads the verdict out of a partial JSON stream, before it is complete. */
export function readPartialJudgement(partial: string): { quality?: MoveQuality; headline?: string } {
  const quality = MOVE_QUALITIES.find((q) => q === partial.match(/"quality"\s*:\s*"([a-z]+)"/)?.[1])
  const rawHeadline = partial.match(/"headline"\s*:\s*"((?:[^"\\]|\\.)*)"/)?.[1]
  let headline: string | undefined
  if (rawHeadline !== undefined) {
    try {
      headline = JSON.parse(`"${rawHeadline}"`)
    } catch {
      headline = undefined
    }
  }
  return { quality, headline }
}

// ── Instant steps: choose, spot, cut, order ─────────────────

export interface StepResult {
  quality: MoveQuality
  headline: string
  comment: string
  /** Teaching note shown under the verdict, mostly when the answer is wrong. */
  explain?: string
}

/** First-try success earns "great"; success after a retry earns "good". */
function success(firstTry: boolean, comment: string): StepResult {
  return firstTry
    ? { quality: 'great', headline: 'Best move!', comment }
    : { quality: 'good', headline: 'Found it.', comment }
}

const quoted = (words: string[]) => words.map((w) => `“${w}”`).join(', ').replace(/, ([^,]*)$/, ' and $1')

export function judgeChoose(step: ChooseStep, optionIndex: number, firstTry: boolean): StepResult {
  const option = step.options[optionIndex]
  if (option?.correct) return success(firstTry, option.why)
  return {
    quality: 'mistake',
    headline: 'Not this one.',
    comment: option?.why ?? '',
    explain: step.hint,
  }
}

export interface SpotChunk {
  /** Text as displayed, including any punctuation that follows it. */
  text: string
  /** The word itself, without surrounding punctuation. */
  core: string
  /** Punctuation written right after the brackets; it stays when the words are cut. */
  tail: string
  /** Part of a phrase that must be tapped (or cut). */
  target: boolean
  /** Part of a phrase that may be tapped (or cut) or left alone. */
  optional: boolean
  /** Which bracketed phrase the word belongs to; -1 for plain words. */
  group: number
}

const stripPunct = (w: string) => w.replace(/^[“"‘(]+|[,.;:!?…”"’)]+$/g, '') || w

/**
 * Splits a sentence into tappable tiles. Every word is its own tile, so a
 * target phrase never stands out as one long tile: "[her blood ran cold]" is
 * four tiles of one group. "{that}" marks an optional cut. With
 * `units: 'sentence'` each sentence is one tile, for steps that judge whole
 * sentences (a point-of-view slip, for instance).
 */
export function parseSpot(sentence: string, units: 'word' | 'sentence' = 'word'): SpotChunk[] {
  const chunks: SpotChunk[] = []
  let group = 0
  if (units === 'sentence') {
    const re = /\[([^\]]+)\]|([^\s[][^[]*?[.!?…][”"’)]*)(?=\s|$)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(sentence)) !== null) {
      const text = (m[1] ?? m[2]).trim()
      chunks.push({ text, core: text, tail: '', target: m[1] !== undefined, optional: false, group: m[1] !== undefined ? group++ : -1 })
    }
    return chunks
  }
  const re = /\[([^\]]+)\]([^\s[{]*)|\{([^}]+)\}([^\s[{]*)|(\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(sentence)) !== null) {
    if (m[5] !== undefined) {
      chunks.push({ text: m[5], core: stripPunct(m[5]), tail: '', target: false, optional: false, group: -1 })
      continue
    }
    const target = m[1] !== undefined
    const words = (target ? m[1] : m[3]).split(/\s+/)
    const tail = (target ? m[2] : m[4]) ?? ''
    const g = group++
    words.forEach((w, k) => {
      const last = k === words.length - 1
      chunks.push({ text: last ? w + tail : w, core: stripPunct(w), tail: last ? tail : '', target, optional: !target, group: g })
    })
  }
  return chunks
}

/** Tiles of a spot or cut step. */
export function chunksOf(step: SpotStep | CutStep): SpotChunk[] {
  return parseSpot(step.sentence, step.kind === 'spot' ? (step.units ?? 'word') : 'word')
}

/** The sentence once the given tiles are cut: tails move to the previous word, the first letter is capitalised. */
export function cutResult(chunks: SpotChunk[], cut: number[]): string {
  const removed = new Set(cut)
  const words: string[] = []
  chunks.forEach((c, i) => {
    if (!removed.has(i)) words.push(c.text)
    else if (c.tail && words.length > 0) words[words.length - 1] += c.tail
  })
  const text = words.join(' ').replace(/\s+([,.;:!?])/g, '$1')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** How a tapped tile is shown after a check: part of the answer, harmless, or a wrong tap. */
export function tapVerdict(chunk: SpotChunk, mode: 'spot' | 'cut'): 'right' | 'neutral' | 'wrong' {
  if (chunk.target) return 'right'
  if (chunk.optional || (mode === 'spot' && STOPWORDS.has(chunk.core.toLowerCase()))) return 'neutral'
  return 'wrong'
}

type Tally = { hits: number; misses: number; wrong: number; wrongWords: string[]; missedWords: string[] }

/**
 * Counts phrases found, phrases missed and wrong taps. In a spot step a phrase
 * is found once its meaningful words are tapped (small words like "her" or
 * "the" are optional) and stray small words are ignored. In a cut step every
 * word of the phrase must go, and any other cut word counts as wrong, because
 * it changes the sentence.
 */
function tally(chunks: SpotChunk[], selected: number[], mode: 'spot' | 'cut'): Tally {
  const picked = new Set(selected)
  const isSmall = (c: SpotChunk) => mode === 'spot' && STOPWORDS.has(c.core.toLowerCase())
  const groups = [...new Set(chunks.filter((c) => c.target).map((c) => c.group))]
  const members = (g: number) => chunks.map((c, i) => ({ c, i })).filter(({ c }) => c.group === g)
  const found = groups.filter((g) => {
    const words = members(g)
    const needed = words.filter(({ c }) => !isSmall(c))
    return (needed.length ? needed : words).every(({ i }) => picked.has(i))
  })
  const wrongIdx = [...picked].filter((i) => chunks[i] && !chunks[i].target && !chunks[i].optional && !isSmall(chunks[i]))
  return {
    hits: found.length,
    misses: groups.length - found.length,
    wrong: wrongIdx.length,
    wrongWords: wrongIdx.map((i) => chunks[i].core),
    missedWords: groups.filter((g) => !found.includes(g)).map((g) => members(g).map(({ c }) => c.core).join(' ')),
  }
}

export function judgeSpot(step: SpotStep, selected: number[], firstTry: boolean): StepResult & Tally {
  const t = tally(chunksOf(step), selected, 'spot')
  const total = t.hits + t.misses
  if (t.misses === 0 && t.wrong === 0) return { ...success(firstTry, step.why), ...t }
  if (t.wrong === 0 && t.hits > 0) {
    return {
      quality: 'inaccuracy',
      headline: `${t.hits} of ${total}. Some are still hiding.`,
      comment: `You found ${t.hits === 1 ? 'one' : t.hits}. ${t.misses === 1 ? 'One more is' : `${t.misses} more are`} still in the sentence.`,
      explain: step.hint,
      ...t,
    }
  }
  const smallTarget = chunksOf(step).some((c) => c.target && STOPWORDS.has(c.core.toLowerCase()))
  return {
    quality: 'mistake',
    headline:
      t.wrong === 0
        ? 'Nothing found yet.'
        : t.wrongWords.length === 1
          ? `“${t.wrongWords[0]}” is not the problem.`
          : 'Those words are not the problem.',
    comment:
      t.wrong === 0
        ? `There ${total === 1 ? 'is one' : `are ${total}`} to find.${smallTarget ? '' : ' Small words like “the” or “he” are never the answer on their own.'}`
        : `${quoted(t.wrongWords)} ${t.wrongWords.length === 1 ? 'does its' : 'do their'} job here.${t.hits ? ` You did find ${t.hits} of ${total}.` : ''}`,
    explain: step.hint,
    ...t,
  }
}

export function judgeCut(step: CutStep, cut: number[], firstTry: boolean): StepResult & Tally {
  const chunks = chunksOf(step)
  const t = tally(chunks, cut, 'cut')
  const result = cutResult(chunks, cut)
  const total = t.hits + t.misses
  if (t.misses === 0 && t.wrong === 0) return { ...success(firstTry, step.why), ...t }
  if (t.wrong === 0) {
    return {
      quality: 'inaccuracy',
      headline: `${t.hits} of ${total} cut. There is still padding.`,
      comment: `Your version: “${result}” Read it again: ${t.misses === 1 ? 'one word still adds' : `${t.misses} words still add`} nothing.`,
      explain: step.hint,
      ...t,
    }
  }
  return {
    quality: 'mistake',
    headline: t.wrongWords.length === 1 ? `You cut “${t.wrongWords[0]}”, which carries meaning.` : 'You cut words that carry meaning.',
    comment: `Your version: “${result}” Without ${quoted(t.wrongWords)}, the sentence loses information or no longer holds together. Cut only what the reader would not miss.`,
    explain: step.hint,
    ...t,
  }
}

/**
 * Deterministic shuffle, so server and client render the same order.
 * Seeded from the text with an FNV-1a hash and drawn with mulberry32: a plain
 * LCG taken modulo a small number repeats the same swaps for every seed, which
 * put most right answers in the last position.
 */
export function seededOrder(length: number, seedText: string): number[] {
  let h = 0x811c9dc5
  for (const ch of seedText) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0
  let state = h
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const order = Array.from({ length }, (_, i) => i)
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  // Never show the answer as the starting order.
  if (length > 1 && order.every((v, i) => v === i)) order.push(order.shift()!)
  return order
}

/**
 * Answer slots for multiple choice, balanced across the whole catalog: questions
 * with the same number of options are taken in blocks of that size, and each
 * block places its right answers in a shuffled set of positions. Every letter
 * gets its share, and the pattern within a lesson stays unpredictable.
 */
let answerSlots: WeakMap<ChooseStep, number> | null = null

function slotFor(step: ChooseStep): number {
  if (!answerSlots) {
    answerSlots = new WeakMap()
    const byLength = new Map<number, ChooseStep[]>()
    for (const t of TECHNIQUES) {
      for (const s of [...t.moves, ...(t.lessons ?? []).flat()]) {
        if (s.kind === 'choose') byLength.set(s.options.length, [...(byLength.get(s.options.length) ?? []), s])
      }
    }
    for (const [n, steps] of byLength) {
      steps.forEach((s, k) => {
        const block = seededOrder(n, `answer-slots-${n}-${Math.floor(k / n)}`)
        answerSlots!.set(s, block[k % n])
      })
    }
  }
  return answerSlots.get(step) ?? seededOrder(step.options.length, step.goal)[0]
}

/**
 * Display order of a multiple-choice step: the right answer goes to its balanced
 * slot, shifted by the attempt number so a replay moves it, and the wrong
 * options are shuffled around it.
 */
export function chooseOrder(step: ChooseStep, attempt = 0): number[] {
  const n = step.options.length
  const right = step.options.findIndex((o) => o.correct)
  const wrong = step.options.map((_, i) => i).filter((i) => i !== right)
  const shuffled = seededOrder(wrong.length, `${step.goal}|${attempt}`).map((i) => wrong[i])
  const slot = (slotFor(step) + attempt) % n
  return [...shuffled.slice(0, slot), right, ...shuffled.slice(slot)]
}

/** Tile text: no capital on the opening tile and no final full stop, so neither gives the answer away. */
export function tileText(step: OrderStep, index: number): string {
  let text = step.chunks[index]
  if (index === 0 && !/^(I\b|[A-Z][a-z]*[A-Z])/.test(text)) text = text.charAt(0).toLowerCase() + text.slice(1)
  if (index === step.chunks.length - 1) text = text.replace(/[.!?]+$/, '')
  return text
}

/** The sentence the player built so far, with a capital and, once complete, the final mark. */
export function assembleOrder(step: OrderStep, picked: number[]): string {
  const text = picked.map((i) => tileText(step, i)).join(' ')
  const done = picked.length === step.chunks.length
  const end = step.chunks[step.chunks.length - 1].match(/[.!?]+$/)?.[0] ?? '.'
  const cased = text.charAt(0).toUpperCase() + text.slice(1)
  return done ? cased.replace(/,$/, '') + end : cased
}

export function judgeOrder(step: OrderStep, picked: number[], firstTry: boolean): StepResult {
  const same = (a: number[]) => a.length === picked.length && a.every((v, i) => v === picked[i])
  if (same(step.chunks.map((_, i) => i))) return success(firstTry, step.why)
  if (step.accept?.some(same)) return { quality: 'good', headline: 'That works too.', comment: step.why }

  // Say where the sentence lands, since the ending is what this scale trains.
  const lastIndex = step.chunks.length - 1
  const endings = new Set([lastIndex, ...(step.accept ?? []).map((a) => a[a.length - 1])])
  const yourEnd = tileText(step, picked[picked.length - 1])
  const rightEnd = tileText(step, lastIndex)
  const endsRight = endings.has(picked[picked.length - 1])
  return {
    quality: 'mistake',
    headline: endsRight ? 'The ending is right; the build-up is not.' : `Your sentence ends on “${yourEnd}”.`,
    comment: endsRight
      ? 'Read it aloud: the parts before the ending should lead into it smoothly, one rising step at a time.'
      : `The last words are the ones the reader remembers. Here the strongest part is “${rightEnd}”, so it belongs at the end.`,
    explain: step.hint,
  }
}

/** A hint: one thing to do now, and why it helps. */
export interface Hint {
  action: string
  why?: string
}

const half = (index: number, total: number) => (index < total / 2 ? 'first' : 'second')

/**
 * The hint for an instant step: an action to take first, like a chess hint
 * that shows which piece to move. It points at the answer without giving it.
 */
export function quizHint(step: ChooseStep | SpotStep | CutStep | OrderStep, technique: DrillTechnique): Hint {
  const why = step.hint || technique.criteria
  switch (step.kind) {
    case 'choose': {
      const wrong = step.options.find((o) => !o.correct)
      if (!wrong) return { action: 'Read each option aloud and keep the one that sounds inevitable.', why }
      const stop = /[.!?…]$/.test(wrong.text) ? '' : '.'
      return { action: `First, cross out “${wrong.text}”${stop}`, why: wrong.why }
    }
    case 'spot': {
      const chunks = chunksOf(step)
      const groups = new Set(chunks.filter((c) => c.target).map((c) => c.group)).size
      const where = half(chunks.findIndex((c) => c.target), chunks.length)
      return {
        action:
          groups === 1
            ? `Reread the ${where} half slowly: the culprit is there.`
            : `Reread the ${where} half slowly: the first of ${groups} culprits is there.`,
        why,
      }
    }
    case 'cut': {
      const chunks = chunksOf(step)
      const n = chunks.filter((c) => c.target).length
      const where = half(chunks.findIndex((c) => c.target), chunks.length)
      return { action: `Cut ${n === 1 ? 'one word' : `${n} words`}. Start in the ${where} half.`, why }
    }
    case 'order':
      return { action: `Put “${tileText(step, step.chunks.length - 1)}” at the end, then build up to it.`, why }
  }
}

/** The constraints of a written move, in plain words, for the coach's prompt. */
export function describeConstraints(rules: MoveRule[] = [], maxSentences = 1): string[] {
  return checkMove(rules, '', [], maxSentences).map((c) => c.label.replace(/ · \d+$/, ''))
}

/** What the coach returns when the writer asks for help before a written move. */
export interface WrittenHint {
  action: string
  solution: string
}

export const WRITTEN_HINT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['action', 'solution'],
  properties: {
    action: { type: 'string' },
    solution: { type: 'string' },
  },
} as const

/** What "Show answer" displays for an instant step. */
export function revealAnswer(step: ChooseStep | SpotStep | CutStep | OrderStep): { headline: string; comment: string } {
  switch (step.kind) {
    case 'choose': {
      const right = step.options.find((o) => o.correct)
      return { headline: `The answer: “${right?.text ?? ''}”`, comment: right?.why ?? '' }
    }
    case 'spot': {
      const chunks = chunksOf(step)
      const phrases = [...new Set(chunks.filter((c) => c.target).map((c) => c.group))].map((g) =>
        chunks.filter((c) => c.group === g).map((c) => c.core).join(' ')
      )
      return { headline: `${step.units === 'sentence' ? 'The sentence' : 'The words'}: ${quoted(phrases)}.`, comment: step.why }
    }
    case 'cut': {
      const chunks = chunksOf(step)
      const cut = chunks.map((c, i) => (c.target ? i : -1)).filter((i) => i >= 0)
      return { headline: `“${cutResult(chunks, cut)}”`, comment: step.why }
    }
    case 'order':
      return { headline: `“${assembleOrder(step, step.chunks.map((_, i) => i))}”`, comment: step.why }
  }
}
