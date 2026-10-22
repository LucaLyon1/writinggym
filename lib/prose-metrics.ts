/**
 * Deterministic prose metrics: the "tuner" of the drills page.
 * Heuristic, English-only, and cheap enough to run on every keystroke.
 */

export interface SentenceMetrics {
  text: string
  words: number
}

export interface ProseMetrics {
  words: number
  sentences: SentenceMetrics[]
  meanLength: number
  /** Standard deviation of sentence length, in words. */
  lengthSpread: number
  shortest: number
  longest: number
  passive: string[]
  adverbs: string[]
  toBe: number
  /** Openers used by 2+ sentences, with counts. */
  repeatedOpeners: { word: string; count: number }[]
  punctuation: {
    commas: number
    semicolons: number
    colons: number
    dashes: number
    questions: number
    exclamations: number
    ellipses: number
  }
}

const ABBREVIATIONS = /\b(Mr|Mrs|Ms|Dr|St|Jr|Sr|Prof|vs|etc|e\.g|i\.e)\.$/i

export function countWords(text: string): number {
  const matches = text.match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]+(?:['’-][A-Za-zÀ-ÖØ-öø-ÿ0-9]+)*/g)
  return matches ? matches.length : 0
}

export function splitSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return []
  const parts: string[] = []
  // Sentence end: terminal punctuation, optional closing quotes/brackets, then space.
  const re = /([.!?…]+["'”’)\]]*)\s+(?=["'“‘(\[]?[A-Z0-9À-Ö])/g
  let start = 0
  let match: RegExpExecArray | null
  while ((match = re.exec(normalized)) !== null) {
    const end = match.index + match[1].length
    const candidate = normalized.slice(start, end)
    if (ABBREVIATIONS.test(candidate)) continue
    parts.push(candidate.trim())
    start = end + (match[0].length - match[1].length)
  }
  const rest = normalized.slice(start).trim()
  if (rest) parts.push(rest)
  return parts.filter((s) => countWords(s) > 0)
}

const TO_BE = ['am', 'is', 'are', 'was', 'were', 'be', 'been', 'being']

const IRREGULAR_PARTICIPLES = new Set(
  (
    'known given taken seen done made written broken spoken driven eaten fallen forgotten hidden held ' +
    'left lost found kept told thrown worn torn born built bought brought caught taught sold sent shot ' +
    'shut hit hurt set put cut beaten bitten chosen frozen stolen woken sung rung drunk begun understood ' +
    'heard met paid said won led fed bound wound ground spun struck hung dug laid shaken forbidden ' +
    'forgiven ridden risen shown sworn swept thought felt meant read run become overcome withheld'
  ).split(' ')
)

/** -ed words that are almost always adjectives after "to be". */
const ED_ADJECTIVES = new Set(
  (
    'tired bored scared excited interested worried married dead red bed need naked wicked sacred ' +
    'crooked rugged ragged aged beloved learned supposed used'
  ).split(' ')
)

const LY_NOT_ADVERBS = new Set(
  (
    'only family early reply ugly holy lily belly fly july italy supply apply rely jelly bully silly ' +
    'lonely lovely friendly hilly curly wily oily ally rally tally folly holly jolly melancholy anomaly ' +
    'assembly butterfly monopoly homily costly deadly elderly orderly lively likely comply imply multiply ' +
    'ply sly lowly smelly chilly surly burly gully sully emily kelly sally molly billy willy ' +
    'bubbly cuddly wobbly prickly'
  ).split(' ')
)

function words(text: string): string[] {
  return (text.toLowerCase().match(/[a-z’']+/g) ?? []).map((w) => w.replace(/[’']/g, "'"))
}

export function findPassive(text: string): string[] {
  const hits: string[] = []
  const re = /\b(am|is|are|was|were|be|been|being|get|gets|got|gotten|getting)\s+(?:(?:not|never|also|just|already|still|often|always|\w+ly)\s+)?([a-z]+)\b/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const participle = m[2].toLowerCase()
    const isParticiple =
      (participle.endsWith('ed') && participle.length > 3 && !ED_ADJECTIVES.has(participle)) ||
      IRREGULAR_PARTICIPLES.has(participle)
    if (isParticiple) hits.push(m[0])
  }
  return hits
}

export function findAdverbs(text: string): string[] {
  return words(text).filter((w) => w.length > 3 && w.endsWith('ly') && !LY_NOT_ADVERBS.has(w))
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
}

function spread(xs: number[]): number {
  if (xs.length < 2) return 0
  const m = mean(xs)
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)))
}

export function analyzeProse(text: string): ProseMetrics {
  const sentences = splitSentences(text).map((s) => ({ text: s, words: countWords(s) }))
  const lengths = sentences.map((s) => s.words)
  const allWords = words(text)

  const openerCounts = new Map<string, number>()
  for (const s of sentences) {
    const first = words(s.text)[0]
    if (first) openerCounts.set(first, (openerCounts.get(first) ?? 0) + 1)
  }

  return {
    words: countWords(text),
    sentences,
    meanLength: mean(lengths),
    lengthSpread: spread(lengths),
    shortest: lengths.length ? Math.min(...lengths) : 0,
    longest: lengths.length ? Math.max(...lengths) : 0,
    passive: findPassive(text),
    adverbs: findAdverbs(text),
    toBe: allWords.filter((w) => TO_BE.includes(w) || /^(i'm|you're|we're|they're|he's|she's|it's|that's|there's)$/.test(w)).length,
    repeatedOpeners: [...openerCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count),
    punctuation: {
      commas: (text.match(/,/g) ?? []).length,
      semicolons: (text.match(/;/g) ?? []).length,
      colons: (text.match(/:/g) ?? []).length,
      dashes: (text.match(/—|–|\s-\s|--/g) ?? []).length,
      questions: (text.match(/\?/g) ?? []).length,
      exclamations: (text.match(/!/g) ?? []).length,
      ellipses: (text.match(/…|\.\.\./g) ?? []).length,
    },
  }
}
