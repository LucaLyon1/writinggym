import { ALBALAT_TECHNIQUES } from './drills-albalat'
import { CORE_LESSONS } from './drills-core-lessons'

/**
 * Writing drills ("scales"): a technique practiced over a subject.
 *
 * Music analogy: the technique is the scale (ternary, cumulative, staccato…)
 * and the subject is the key it is played in (a character, a setting…).
 * The same technique is meant to be repeated across every subject until it
 * becomes automatic.
 */

export type DrillFamily =
  | 'rhythm'
  | 'structure'
  | 'voice'
  | 'articulation'
  | 'expression'
  | 'concision'
  | 'harmony'
  | 'imagery'
  | 'narration'

/** A rule checked instantly, in the browser, on a single move. */
export type MoveRule =
  | { kind: 'maxWords'; n: number }
  | { kind: 'minWords'; n: number }
  | { kind: 'noPassive' }
  | { kind: 'noAdverbs' }
  | { kind: 'noToBe' }
  | { kind: 'contains'; mark: 'semicolon' | 'colon' | 'dash' }
  | { kind: 'sameOpener' }
  | { kind: 'conjunctions'; n: number }
  | { kind: 'noRepeats' }
  | { kind: 'noCliches' }
  | { kind: 'noFiller' }
  | { kind: 'noJingle' }
  | { kind: 'noEmotionWords' }

/** Write a sentence, judged by the coach. The default step. */
export interface WriteStep {
  kind?: 'write'
  goal: string
  rules?: MoveRule[]
  /** Sentences allowed in one move (default 1). */
  sentences?: number
}

/** Transform a given sentence, judged by the coach. */
export interface RewriteStep {
  kind: 'rewrite'
  goal: string
  source: string
  rules?: MoveRule[]
  sentences?: number
}

/** Pick the best version. Checked instantly. */
export interface ChooseStep {
  kind: 'choose'
  goal: string
  /** Optional sentence the options complete or replace. */
  prompt?: string
  options: { text: string; correct?: boolean; why: string }[]
  /** What to look for, shown when the player gets it wrong. */
  hint?: string
}

/**
 * Tap the faulty words. Targets are written in [brackets]; words in {braces}
 * may be tapped or left alone. Checked instantly.
 */
export interface SpotStep {
  kind: 'spot'
  goal: string
  sentence: string
  why: string
  hint?: string
  /** Tile size: one word (default) or one whole sentence. */
  units?: 'word' | 'sentence'
}

/**
 * Strike out the superfluous words and watch the sentence rebuild. Words that
 * must go are in [brackets], words that may go are in {braces}. Punctuation
 * inside the brackets goes with the cut; punctuation right after them stays.
 * Checked instantly.
 */
export interface CutStep {
  kind: 'cut'
  goal: string
  sentence: string
  why: string
  hint?: string
}

/** Rebuild a sentence from tiles, given in the right order. Checked instantly. */
export interface OrderStep {
  kind: 'order'
  goal: string
  chunks: string[]
  /** Other orders that are also right, as lists of chunk indexes. */
  accept?: number[][]
  why: string
  hint?: string
}

/** One move of a puzzle. */
export type DrillMove = WriteStep | RewriteStep | ChooseStep | SpotStep | CutStep | OrderStep

/** Moves the coach judges; the others are checked in the browser. */
export function isWritten(step: DrillMove): step is WriteStep | RewriteStep {
  return step.kind === undefined || step.kind === 'write' || step.kind === 'rewrite'
}

/** Instant rules of a written move (none for quiz steps). */
export function rulesOf(step: DrillMove): MoveRule[] | undefined {
  return isWritten(step) ? step.rules : undefined
}

export interface DrillTechnique {
  id: string
  name: string
  family: DrillFamily
  level: 1 | 2 | 3
  /** Instruction shown to the writer. */
  instruction: string
  /** What the judge checks, in plain terms. */
  criteria: string
  /** A model of the technique: a real quote when one fits, otherwise our own sentence. */
  example: string
  /** Author and work when `example` is a real quote, checked against the source text. */
  exampleSource?: string
  /** A verified quote from Albalat, L'Art d'écrire enseigné en vingt leçons (1899), with an English translation. */
  albalat?: { fr: string; en: string; lesson: string }
  /**
   * Subject ids this scale is played in, when not all of them fit (dialogue
   * needs people, a telling trait needs something to portray). At least three.
   */
  subjects?: string[]
  /** The puzzle, played on a subject: one sentence per move. */
  moves: DrillMove[]
  /**
   * Fixed lessons instead of subjects. When set, each lesson is its own puzzle
   * and earns its own star, and `moves` is unused.
   */
  lessons?: DrillMove[][]
}

const repeat = (n: number, move: DrillMove): DrillMove[] => Array.from({ length: n }, () => move)

export interface DrillSubject {
  id: string
  name: string
  seeds: string[]
}

export const FAMILY_LABELS: Record<DrillFamily, string> = {
  rhythm: 'Rhythm',
  structure: 'Structure',
  voice: 'Voice & verbs',
  articulation: 'Articulation',
  expression: 'Expression',
  concision: 'Concision',
  harmony: 'Harmony',
  imagery: 'Imagery',
  narration: 'Narration',
}

const CORE_TECHNIQUES: DrillTechnique[] = [
  // ── Rhythm ────────────────────────────────────────────────
  {
    id: 'short-long',
    name: 'Short, then long',
    family: 'rhythm',
    level: 1,
    instruction: 'Alternate sentence lengths on purpose. Include at least one sentence under 6 words and one over 20.',
    criteria: 'Sentence lengths vary deliberately; the short sentences land on the moments that deserve weight.',
    example: 'Now listen. I vary the sentence length, and I create music. Music. The writing sings.',
    exampleSource: 'Gary Provost, 100 Ways to Improve Your Writing (1985)',
    albalat: {
      fr: 'On ne doit pas plus adopter le style à longues phrases que le style à phrases courtes. C’est le mélange seul qui produit la variété.',
      en: 'You should no more adopt a style of long sentences than a style of short ones. Only the mix produces variety.',
      lesson: 'Leçon 8, L’harmonie des phrases',
    },
    moves: [
      { goal: 'A short sentence. Under 6 words.', rules: [{ kind: 'maxWords', n: 5 }] },
      { goal: 'A long sentence, over 20 words, that keeps moving: add actions and details, not filler.', rules: [{ kind: 'minWords', n: 21 }] },
      { goal: 'Short again, under 6 words. Make it the line the reader remembers.', rules: [{ kind: 'maxWords', n: 5 }] },
    ],
  },
  {
    id: 'staccato',
    name: 'Staccato',
    family: 'rhythm',
    level: 2,
    instruction: 'Write only short sentences: 8 words or fewer each. Make the rhythm drive, not stutter.',
    criteria: 'Every sentence is short, yet the sequence still flows with logical and sonic continuity.',
    example: 'Dogs, undistinguishable in mire. Horses, scarcely better; splashed to their very blinkers.',
    exampleSource: 'Charles Dickens, Bleak House (1853)',
    moves: [
      { goal: 'Open the scene. 8 words or fewer.', rules: [{ kind: 'maxWords', n: 8 }] },
      { goal: 'Keep it moving. 8 words or fewer.', rules: [{ kind: 'maxWords', n: 8 }] },
      { goal: 'Switch to another sense or another person. 8 words or fewer.', rules: [{ kind: 'maxWords', n: 8 }] },
      { goal: 'Zoom in on one small detail. 8 words or fewer.', rules: [{ kind: 'maxWords', n: 8 }] },
      { goal: 'End on a hit. 8 words or fewer.', rules: [{ kind: 'maxWords', n: 8 }] },
    ],
  },
  {
    id: 'one-breath',
    name: 'One long breath',
    family: 'rhythm',
    level: 3,
    instruction: 'Write a single sentence of at least 40 words that stays clear from start to finish.',
    criteria: 'One grammatical sentence, 40+ words, never loses its subject; punctuation guides the breath.',
    example: 'Emma Woodhouse, handsome, clever, and rich, with a comfortable home and happy disposition, seemed to unite some of the best blessings of existence; and had lived nearly twenty-one years in the world with very little to distress or vex her.',
    exampleSource: 'Jane Austen, Emma (1815)',
    albalat: {
      fr: 'Les belles périodes prouvent qu’on a du souffle.',
      en: 'Fine long sentences prove that you have breath.',
      lesson: 'Leçon 8, L’harmonie des phrases',
    },
    moves: [
      {
        goal: 'One sentence of 40+ words. Name the subject and its verb early, then hang every detail on them.',
        rules: [{ kind: 'minWords', n: 40 }],
      },
    ],
  },
  {
    id: 'cadence-major',
    name: 'Rising cadence',
    family: 'rhythm',
    level: 2,
    instruction: 'Build a sentence in parts that grow, so it opens out at the end (the French “cadence majeure”).',
    criteria: 'The parts grow, or at least never shrink, and the last part is clearly the longest: the sentence widens as it ends.',
    example: 'With malice toward none, with charity for all, with firmness in the right as God gives us to see the right…',
    exampleSource: 'Abraham Lincoln, Second Inaugural Address (1865)',
    moves: [
      { goal: 'Three parts that grow: short, longer, longest.' },
      { goal: 'Another one. Make the last part the longest by far.' },
    ],
  },
  {
    id: 'cadence-minor',
    name: 'Falling cadence',
    family: 'rhythm',
    level: 2,
    instruction: 'Build up with a long first part, then end on a short, sharp one (the French “cadence mineure”).',
    criteria: 'The last part is clearly shorter than what comes before it and carries the surprise or the blow.',
    example: 'Never in the field of human conflict was so much owed by so many to so few.',
    exampleSource: 'Winston Churchill, House of Commons, 20 August 1940',
    moves: [
      { goal: 'A long build-up, then a short drop: end on two or three words.' },
      { goal: 'Again, and make the short ending the surprise.' },
    ],
  },

  // ── Structure ─────────────────────────────────────────────
  {
    id: 'parallelism',
    name: 'Parallel parts',
    family: 'structure',
    level: 1,
    instruction: 'Give every item in a series the same grammatical form: all nouns, all “-ing” words, all clauses.',
    criteria: 'Every item in the series has the same form, so the reader hears one pattern; nothing breaks it.',
    example: 'A time to kill, and a time to heal; a time to break down, and a time to build up…',
    exampleSource: 'Ecclesiastes 3:3, King James Version (1611)',
    moves: [],
  },
  {
    id: 'binary',
    name: 'Binary rhythm',
    family: 'structure',
    level: 1,
    instruction: 'Build your sentences on pairs: two adjectives, two verbs, two clauses that balance.',
    criteria: 'Parallel pairs of the same grammatical kind, giving balance or opposition.',
    example: 'To be, or not to be, that is the question',
    exampleSource: 'William Shakespeare, Hamlet (c. 1600)',
    moves: [
      { goal: 'A balanced pair: two words or two clauses of the same kind, of similar weight.' },
      { goal: 'A pair in opposition: two halves that pull against each other.' },
    ],
  },
  {
    id: 'ternary',
    name: 'Ternary rhythm',
    family: 'structure',
    level: 1,
    instruction: 'Build on groups of three parallel elements. Make the third element the longest or the strongest.',
    criteria: 'Groups of three items of the same grammatical kind; the third lands with the most weight.',
    example: '…that among these are Life, Liberty and the pursuit of Happiness.',
    exampleSource: 'Declaration of Independence (1776)',
    moves: [
      { goal: 'A group of three. Make the third the heaviest.' },
      { goal: 'Another group of three, of a different kind (verbs, clauses or nouns).' },
    ],
  },
  {
    id: 'accumulation',
    name: 'Accumulation',
    family: 'structure',
    level: 2,
    instruction: 'List four or more things of the same kind, so the pile itself makes the point.',
    criteria: 'A list of four or more items of the same kind that creates abundance, overload or chaos.',
    example: '…a squeezing, wrenching, grasping, scraping, clutching, covetous, old sinner!',
    exampleSource: 'Charles Dickens, A Christmas Carol (1843)',
    moves: [
      { goal: 'Pile up four or more things of one kind: all nouns, or all verbs.' },
      { goal: 'A short sentence that closes the pile.' },
    ],
  },
  {
    id: 'gradation',
    name: 'Gradation',
    family: 'structure',
    level: 2,
    instruction: 'Order a series so each element is more intense than the one before.',
    criteria: 'A series that grows steadily stronger and ends on the strongest term.',
    example: '…tribulation worketh patience; And patience, experience; and experience, hope',
    exampleSource: 'Romans 5:3–4, King James Version (1611)',
    moves: [],
  },
  {
    id: 'cumulative',
    name: 'Cumulative sentence',
    family: 'structure',
    level: 2,
    instruction: 'Start with a short, simple statement, then add details after commas, each one zooming in closer.',
    criteria: 'A short base statement followed by two or more details added after commas (like “his fingers quick and scarred”) that sharpen the picture.',
    example: 'The lawn started at the beach and ran towards the front door for a quarter of a mile, jumping over sundials and brick walks and burning gardens—finally when it reached the house drifting up the side in bright vines as though from the momentum of its run.',
    exampleSource: 'F. Scott Fitzgerald, The Great Gatsby (1925)',
    moves: [
      { goal: 'A base of five words or so (“She waited at the gate”), then two or more details after commas, each closer in.' },
      { goal: 'Another one. Make the last detail the smallest and sharpest.' },
    ],
  },
  {
    id: 'periodic',
    name: 'Periodic sentence',
    family: 'structure',
    level: 3,
    instruction: 'Make the reader wait: put the main point at the very end of the sentence.',
    criteria: 'The setting and circumstances come first; the main statement, and the meaning, arrives only at the end.',
    example: 'Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.',
    exampleSource: 'Herman Melville, Moby-Dick (1851)',
    albalat: {
      fr: 'Une période est une phrase partagée entre plusieurs membres […] et dont le sens complet est suspendu jusqu’à un dernier et parfait repos.',
      en: 'A period is a sentence divided into several parts […] whose full meaning is held in suspense until a final and perfect rest.',
      lesson: 'Leçon 8, L’harmonie des phrases',
    },
    moves: [],
  },
  {
    id: 'anaphora',
    name: 'Anaphora',
    family: 'structure',
    level: 1,
    instruction: 'Start three or more sentences (or parts of a sentence) in a row with the same words.',
    criteria: 'The same opening repeated 3+ times, building insistence rather than monotony.',
    example: '…we shall fight on the beaches, we shall fight on the landing grounds…',
    exampleSource: 'Winston Churchill, House of Commons, 4 June 1940',
    moves: [
      { goal: 'Open with two to four words you can repeat, like “Nobody knew”.' },
      { goal: 'Repeat the same opening. Add something new.', rules: [{ kind: 'sameOpener' }] },
      { goal: 'Repeat it once more and raise the stakes.', rules: [{ kind: 'sameOpener' }] },
    ],
  },
  {
    id: 'antithesis',
    name: 'Antithesis',
    family: 'structure',
    level: 2,
    instruction: 'Put two opposite ideas side by side, built the same way.',
    criteria: 'Two contrasting ideas built with the same grammar, so the opposition is felt.',
    example: 'It was the best of times, it was the worst of times',
    exampleSource: 'Charles Dickens, A Tale of Two Cities (1859)',
    moves: [
      { goal: 'Two opposite ideas, built the same way.' },
      { goal: 'Another one, shorter and sharper.' },
    ],
  },
  {
    id: 'modifiers',
    name: 'Modifiers in place',
    family: 'structure',
    level: 2,
    instruction: 'Put each describing phrase next to what it describes, and make an opening phrase describe the subject that follows it.',
    criteria: 'No dangling or misplaced modifier: every describing phrase sits next to what it describes, so nothing reads two ways.',
    example: 'Not “Walking home, the rain soaked me” but “As I walked home, the rain soaked me.”',
    moves: [],
  },
  {
    id: 'old-new',
    name: 'Old, then new',
    family: 'structure',
    level: 3,
    instruction: 'Open each sentence with something the reader already knows, and end it on something new. That new end becomes the next start.',
    criteria: 'Each sentence opens on information from the one before and ends on the new point, so the passage reads as one chain.',
    example: 'A chain: “She found a key in the drawer. The key opened nothing in the house. The house, it seemed, had a door she had never seen.”',
    moves: [],
  },
  {
    id: 'chiasmus',
    name: 'Chiasmus',
    family: 'structure',
    level: 3,
    instruction: 'Say it, then reverse it: repeat the key words in mirror order (A, B, then B, A).',
    criteria: 'The second half reverses the key terms of the first, and the reversal turns the thought instead of only playing with words.',
    example: '…ask not what your country can do for you–ask what you can do for your country.',
    exampleSource: 'John F. Kennedy, Inaugural Address (1961)',
    moves: [
      { goal: 'A mirror: two key words, then the same two in reverse order. (“You do not keep the house; the house keeps you.”)' },
      { goal: 'Another one. Make the reversal change the meaning, not just the order.' },
    ],
  },

  // ── Voice & verbs ─────────────────────────────────────────
  {
    id: 'active-only',
    name: 'Active voice',
    family: 'voice',
    level: 1,
    instruction: 'Every clause must have a subject that acts. No passive constructions.',
    criteria: 'No passive voice; agents are named and they act.',
    example: 'Buck did not read the newspapers, or he would have known that trouble was brewing…',
    exampleSource: 'Jack London, The Call of the Wild (1903)',
    moves: repeat(3, { goal: 'An active sentence. The subject acts.', rules: [{ kind: 'noPassive' }] }),
  },
  {
    id: 'strong-verbs',
    name: 'Strong verbs',
    family: 'voice',
    level: 1,
    instruction: 'No adverbs ending in -ly and no forms of "to be". Let the verbs do the work.',
    criteria: 'No -ly adverbs, no "to be" verbs; precise verbs carry manner and state.',
    example: 'The cold within him froze his old features, nipped his pointed nose, shrivelled his cheek, stiffened his gait…',
    exampleSource: 'Charles Dickens, A Christmas Carol (1843)',
    moves: repeat(3, {
      goal: 'Let the verb carry it. No -ly adverbs, no "to be".',
      rules: [{ kind: 'noAdverbs' }, { kind: 'noToBe' }],
    }),
  },
  {
    id: 'chastity',
    name: 'Nouns and verbs only',
    family: 'voice',
    level: 3,
    instruction: 'No adjectives and no adverbs at all. Precision must come from nouns and verbs.',
    criteria: 'No adjectives or adverbs; nouns and verbs are exact enough to replace them.',
    example: 'In the beginning God created the heaven and the earth.',
    exampleSource: 'Genesis 1:1, King James Version (1611)',
    moves: repeat(3, { goal: 'Nouns and verbs only. No adjectives, no adverbs.', rules: [{ kind: 'noAdverbs' }] }),
  },

  // ── Articulation (punctuation) ───────────────────────────
  {
    id: 'comma',
    name: 'The comma',
    family: 'articulation',
    level: 1,
    instruction: 'Use commas to guide the reader: after an opening, around an aside, between items, and never alone between two full sentences.',
    criteria: 'Every comma marks a real boundary; no comma splice, no comma between subject and verb, and every aside is closed.',
    example: 'It was a bright cold day in April, and the clocks were striking thirteen.',
    exampleSource: 'George Orwell, Nineteen Eighty-Four (1949)',
    moves: [],
  },
  {
    id: 'semicolon',
    name: 'The semicolon',
    family: 'articulation',
    level: 2,
    instruction: 'Use a semicolon to join two closely linked statements that could each stand alone as a sentence.',
    criteria: 'The semicolon joins two complete statements that are tightly linked; no two sentences glued with a comma.',
    example: 'It is a far, far better thing that I do, than I have ever done; it is a far, far better rest that I go to than I have ever known.',
    exampleSource: 'Charles Dickens, A Tale of Two Cities (1859)',
    moves: repeat(2, { goal: 'Two linked statements joined by a semicolon.', rules: [{ kind: 'contains', mark: 'semicolon' }] }),
  },
  {
    id: 'colon',
    name: 'The colon reveal',
    family: 'articulation',
    level: 2,
    instruction: 'Use a colon to set up and then deliver a reveal, a list or an explanation.',
    criteria: 'The part before the colon creates expectation; the part after pays it off.',
    example: 'Marley was dead: to begin with.',
    exampleSource: 'Charles Dickens, A Christmas Carol (1843)',
    moves: repeat(2, { goal: 'Set something up, then deliver it after a colon.', rules: [{ kind: 'contains', mark: 'colon' }] }),
  },
  {
    id: 'dash',
    name: 'The dash interruption',
    family: 'articulation',
    level: 2,
    instruction: 'Use dashes to interrupt a sentence with an aside or a sudden turn.',
    criteria: 'Dashes create a deliberate break that adds emphasis or a shift in thought.',
    example: 'True!—nervous—very, very dreadfully nervous I had been and am; but why will you say that I am mad?',
    exampleSource: 'Edgar Allan Poe, “The Tell-Tale Heart” (1843)',
    moves: repeat(2, { goal: 'Break the sentence with a dash.', rules: [{ kind: 'contains', mark: 'dash' }] }),
  },
  {
    id: 'polysyndeton',
    name: 'Polysyndeton',
    family: 'articulation',
    level: 2,
    instruction: 'Link a series with "and… and… and" instead of commas to slow it and weigh it down.',
    criteria: 'A series joined by repeated conjunctions, producing weight, fatigue or ceremony.',
    example: 'And Abraham rose up early in the morning, and saddled his ass, and took two of his young men with him, and Isaac his son, and clave the wood for the burnt offering…',
    exampleSource: 'Genesis 22:3, King James Version (1611)',
    moves: [
      { goal: 'Four or more actions, each linked by “and”. Let the series feel long.', rules: [{ kind: 'conjunctions', n: 3 }] },
      { goal: 'Another one, where the “and”s make it feel heavy or endless.', rules: [{ kind: 'conjunctions', n: 3 }] },
    ],
  },
  {
    id: 'asyndeton',
    name: 'Asyndeton',
    family: 'articulation',
    level: 2,
    instruction: 'List three or more actions with no “and”, so the series hits fast.',
    criteria: 'A series of three or more items with no “and” or “or” before the last, producing speed or urgency.',
    example: 'I came, I saw, I conquered.',
    exampleSource: 'Julius Caesar, 47 BC (“Veni, vidi, vici”), as reported by Plutarch and Suetonius',
    moves: [
      { goal: 'A fast list of three or more, with no “and”.' },
      { goal: 'Another one, even faster.' },
    ],
  },

  // ── Narration ─────────────────────────────────────────────
  {
    id: 'show-feeling',
    name: 'Show the feeling',
    family: 'narration',
    level: 1,
    instruction: 'Do not name the emotion. Show what the person does, what the body does, or what they notice.',
    criteria: 'No emotion word carries the feeling; a concrete action, gesture or perception lets the reader infer it, without melodrama.',
    example: 'Gatsby, his hands still in his pockets, was reclining against the mantelpiece in a strained counterfeit of perfect ease, even of boredom.',
    exampleSource: 'F. Scott Fitzgerald, The Great Gatsby (1925)',
    moves: [],
  },
]

/** Core scales with clear right answers, or a shape worth recognising first, are played as lessons. */
const CORE_WITH_LESSONS = CORE_TECHNIQUES.map((t) => (CORE_LESSONS[t.id] ? { ...t, moves: [], lessons: CORE_LESSONS[t.id] } : t))

export const TECHNIQUES: DrillTechnique[] = [...CORE_WITH_LESSONS, ...ALBALAT_TECHNIQUES]

export const SUBJECTS: DrillSubject[] = [
  {
    id: 'character',
    name: 'Character portrait',
    seeds: [
      'An old fisherman mending a net',
      'A child waiting outside the principal’s office',
      'A night nurse at the end of a double shift',
      'A street musician nobody listens to',
      'A grandmother who cheats at cards',
      'A young soldier on his first day home',
    ],
  },
  {
    id: 'action',
    name: 'Action',
    seeds: [
      'Someone chasing a bus that is pulling away',
      'A fall down a flight of stairs',
      'A fight that is over in seconds',
      'Catching a glass before it hits the floor',
      'Escaping a house through a window',
      'A car sliding on an icy road',
    ],
  },
  {
    id: 'feeling',
    name: 'Feeling',
    seeds: [
      'The moment you realize you are lost',
      'Relief after bad news turns out to be false',
      'Jealousy at a friend’s wedding',
      'Opening a letter you have waited months for',
      'Shame at a joke that went too far',
      'Homesickness in a crowded place',
    ],
  },
  {
    id: 'setting',
    name: 'Setting',
    seeds: [
      'A kitchen at six in the morning',
      'An empty train station at night',
      'A market just before it closes',
      'A hospital waiting room',
      'A beach in winter',
      'A classroom after everyone has left',
    ],
  },
  {
    id: 'object',
    name: 'Object',
    seeds: [
      'A pair of worn-out boots',
      'A letter that was never sent',
      'A broken wristwatch',
      'An old key that no longer opens anything',
      'A chipped coffee mug',
      'A photograph with one face torn out',
    ],
  },
  {
    id: 'statement',
    name: 'Plain statement',
    seeds: [
      'Explain why you like the town you live in',
      'Describe how to make a cup of tea',
      'Argue that people should walk more',
      'Explain what a good teacher does',
      'Describe your morning routine',
      'Explain why a rule you dislike exists',
    ],
  },
]

export function getTechnique(id: string): DrillTechnique | undefined {
  return TECHNIQUES.find((t) => t.id === id)
}

export function getSubject(id: string): DrillSubject | undefined {
  return SUBJECTS.find((s) => s.id === id)
}

export interface Drill {
  techniqueId: string
  subjectId: string
  seed: string
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length) % items.length]
}

/** The subjects a scale is played in: its own list, or all of them. */
export function subjectsFor(technique: DrillTechnique): DrillSubject[] {
  return technique.subjects ? SUBJECTS.filter((s) => technique.subjects!.includes(s.id)) : SUBJECTS
}

/** Star keys of a scale: its subjects, or its lessons ("lesson-1"…). */
export function keysFor(technique: DrillTechnique): string[] {
  return technique.lessons ? technique.lessons.map((_, i) => `lesson-${i + 1}`) : subjectsFor(technique).map((s) => s.id)
}

/** The lesson index a drill points to, or -1 for subject drills. */
export function lessonIndex(drill: Drill): number {
  const m = drill.subjectId.match(/^lesson-(\d+)$/)
  return m ? Number(m[1]) - 1 : -1
}

/** The moves of a drill: its lesson, or the scale's subject moves. */
export function stepsFor(technique: DrillTechnique, drill: Drill): DrillMove[] {
  const i = lessonIndex(drill)
  return technique.lessons && i >= 0 ? (technique.lessons[i] ?? technique.lessons[0]) : technique.moves
}

/** Moves in one puzzle of a scale, for display. */
export function puzzleLength(technique: DrillTechnique): number {
  return technique.lessons ? technique.lessons[0].length : technique.moves.length
}

/**
 * Draws a drill. Fixed technique or subject ids are kept; the rest is random.
 * `avoidSubjects` steers away from keys already solved when others remain.
 * For lesson scales, the "subject" is a lesson key and there is no seed.
 */
export function drawDrill(
  opts: { techniqueId?: string; subjectId?: string; avoidSeed?: string; avoidSubjects?: string[] } = {},
  random: () => number = Math.random
): Drill {
  const technique = (opts.techniqueId && getTechnique(opts.techniqueId)) || pick(TECHNIQUES, random)
  const keys = keysFor(technique)
  if (technique.lessons) {
    const fresh = keys.filter((k) => !opts.avoidSubjects?.includes(k))
    // Lessons are played in order: the first one not solved yet.
    const key = opts.subjectId && keys.includes(opts.subjectId) ? opts.subjectId : (fresh[0] ?? pick(keys, random))
    return { techniqueId: technique.id, subjectId: key, seed: '' }
  }
  const subjects = subjectsFor(technique)
  const fresh = subjects.filter((s) => !opts.avoidSubjects?.includes(s.id))
  const fixed = subjects.find((s) => s.id === opts.subjectId)
  const subject = fixed || pick(fresh.length ? fresh : subjects, random)
  const seeds = subject.seeds.filter((s) => s !== opts.avoidSeed)
  return { techniqueId: technique.id, subjectId: subject.id, seed: pick(seeds.length ? seeds : subject.seeds, random) }
}

// ── Path and progress ───────────────────────────────────────

/** A scale earns one star per subject (or lesson) solved cleanly, up to this many. */
export const MAX_STARS = 3

export const LEVEL_NAMES = { 1: 'Foundations', 2: 'Control', 3: 'Mastery' } as const

export const FAMILY_ORDER: DrillFamily[] = [
  'rhythm',
  'structure',
  'voice',
  'articulation',
  'expression',
  'concision',
  'harmony',
  'imagery',
  'narration',
]

/**
 * Suggested order, by level. Within a level, lessons with clear right answers
 * alternate with free-writing scales, and each skill comes after the ones it
 * builds on: parallel parts before ternary rhythm, active voice before strong
 * verbs, the atomic concision scales before the concision capstone.
 * Writers can still pick freely.
 */
const PATH_ORDER = [
  // Foundations
  'active-only', 'cut-padding', 'short-long', 'strong-verbs', 'exact-epithet', 'binary', 'wordy-phrases',
  'parallelism', 'ternary', 'comma', 'cliche', 'anaphora', 'echoes', 'show-feeling', 'observation',
  // Control
  'semicolon', 'cumulative', 'word-order', 'staccato', 'colon', 'gradation', 'modifiers', 'accumulation',
  'coherent-image', 'antithesis', 'dash', 'cadence-minor', 'concision', 'cadence-major', 'sound', 'asyndeton',
  'polysyndeton', 'telling-trait', 'point-of-view',
  // Mastery
  'periodic', 'old-new', 'one-breath', 'chastity', 'scene-summary', 'chiasmus', 'sustained-image', 'dialogue',
  'own-expression',
]

export const PATH: DrillTechnique[] = PATH_ORDER.map((id) => getTechnique(id)).filter((t): t is DrillTechnique => !!t)

/** Subjects or lessons solved cleanly, per technique id. */
export type SolvedMap = Record<string, string[]>

export function starsFor(solved: SolvedMap, techniqueId: string): number {
  const technique = getTechnique(techniqueId)
  const keys = technique ? keysFor(technique) : []
  return Math.min(MAX_STARS, new Set((solved[techniqueId] ?? []).filter((k) => keys.includes(k))).size)
}

export function suggestedTechnique(solved: SolvedMap): DrillTechnique {
  return PATH.find((t) => starsFor(solved, t.id) < MAX_STARS) ?? PATH[0]
}

/**
 * The next puzzle: stay on the current scale in a new subject (or the next
 * lesson) until it has all its stars, then move on along the path.
 */
export function nextPuzzle(current: Drill, solved: SolvedMap, random: () => number = Math.random): Drill {
  const technique =
    starsFor(solved, current.techniqueId) < MAX_STARS ? current.techniqueId : suggestedTechnique(solved).id
  const avoid = [...(solved[technique] ?? []), ...(technique === current.techniqueId ? [current.subjectId] : [])]
  return drawDrill({ techniqueId: technique, avoidSeed: current.seed, avoidSubjects: avoid }, random)
}

export interface ProgressTally {
  stars: number
  maxStars: number
  /** Scales with every star. */
  mastered: number
  scales: number
}

export interface DrillStats extends ProgressTally {
  /** Clean solves recorded, counting every subject or lesson, even past the last star. */
  puzzlesSolved: number
  byLevel: Record<DrillTechnique['level'], ProgressTally>
  byFamily: Record<DrillFamily, ProgressTally>
}

/** Totals for a progress overview: overall, per level and per family. */
export function drillStats(solved: SolvedMap): DrillStats {
  const empty = (): ProgressTally => ({ stars: 0, maxStars: 0, mastered: 0, scales: 0 })
  const total = empty()
  const byLevel = { 1: empty(), 2: empty(), 3: empty() }
  const byFamily = Object.fromEntries(FAMILY_ORDER.map((f) => [f, empty()])) as Record<DrillFamily, ProgressTally>
  let puzzlesSolved = 0
  for (const t of TECHNIQUES) {
    const stars = starsFor(solved, t.id)
    const keys = keysFor(t)
    puzzlesSolved += new Set((solved[t.id] ?? []).filter((k) => keys.includes(k))).size
    for (const tally of [total, byLevel[t.level], byFamily[t.family]]) {
      tally.stars += stars
      tally.maxStars += MAX_STARS
      tally.scales += 1
      if (stars >= MAX_STARS) tally.mastered += 1
    }
  }
  return { ...total, puzzlesSolved, byLevel, byFamily }
}
