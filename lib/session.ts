import type { Passage } from '@/data/passages'

export type SessionLength = 15 | 30 | 45

export type FocusAxis =
  | 'dialogue'
  | 'opening-lines'
  | 'character-description'
  | 'scene-setting'
  | 'interiority'
  | 'transitions'
  | 'rhythm-and-style'

export interface SessionConfig {
  focusAxis: FocusAxis
  sessionLength: SessionLength
}

export const FOCUS_AXES: { id: FocusAxis; label: string; description: string; categoryIds: string[] }[] = [
  {
    id: 'dialogue',
    label: 'Dialogue',
    description: 'Rhythm, subtext, and voice differentiation in conversation',
    categoryIds: ['dialogue'],
  },
  {
    id: 'opening-lines',
    label: 'Opening lines',
    description: 'How to drop a reader into a world with the first sentence',
    categoryIds: ['in-medias-res'],
  },
  {
    id: 'character-description',
    label: 'Character description',
    description: 'Bringing a person to life on the page',
    categoryIds: ['character-intro'],
  },
  {
    id: 'scene-setting',
    label: 'Scene-setting',
    description: 'When setting becomes as alive as any character',
    categoryIds: ['place-and-atmosphere'],
  },
  {
    id: 'interiority',
    label: 'Interiority',
    description: 'The texture of thought, memory, and feeling from the inside',
    categoryIds: ['interiority'],
  },
  {
    id: 'transitions',
    label: 'Transitions',
    description: 'How writers handle the past pressing into the present',
    categoryIds: ['time-and-memory'],
  },
  {
    id: 'rhythm-and-style',
    label: 'Rhythm & Style',
    description: 'Where the how is as important as the what',
    categoryIds: ['rhythm-and-style', 'poetry'],
  },
]

export const SESSION_LENGTHS: { value: SessionLength; label: string }[] = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
]

export function selectPassageForSession(
  passages: Passage[],
  config: SessionConfig,
  completedPassageIds: Set<string> = new Set()
): Passage | null {
  const axisConfig = FOCUS_AXES.find((a) => a.id === config.focusAxis)
  if (!axisConfig) return null

  const eligible = passages.filter(
    (p) => axisConfig.categoryIds.includes(p.categoryId) && !completedPassageIds.has(p.id)
  )

  if (eligible.length === 0) {
    const fallback = passages.filter((p) => axisConfig.categoryIds.includes(p.categoryId))
    if (fallback.length === 0) return null
    return fallback[Math.floor(Math.random() * fallback.length)]
  }

  return eligible[Math.floor(Math.random() * eligible.length)]
}

export function getAxisSpecificPromptGuidance(axis: FocusAxis): string {
  switch (axis) {
    case 'dialogue':
      return 'Pay close attention to rhythm and subtext. Notice how each speaker has a distinct voice — not just in what they say, but in sentence length, word choice, and what they leave unsaid.'
    case 'opening-lines':
      return 'Focus on how the passage creates immediate momentum. What information is withheld? What question does the reader form? How does the syntax mirror the urgency (or calm) of the scene?'
    case 'character-description':
      return 'Study how the writer reveals character. Is it through physical detail, behavior, effect on others, or interior thought? Notice what is chosen and what is omitted.'
    case 'scene-setting':
      return 'Observe how the writer makes the setting do work — not just as backdrop but as an active force. Notice which senses are engaged and how the physical world connects to the emotional register.'
    case 'interiority':
      return 'Follow the texture of thought. How does the writer move between observation and feeling? How do syntax and rhythm mirror the character\'s mental state?'
    case 'transitions':
      return 'Notice how the writer handles movement through time. How does the past enter the present? What bridges the shift — a word, an object, a sensation?'
    case 'rhythm-and-style':
      return 'Listen to the prose. Where does the writer accelerate and where do they slow down? How does sentence structure create meaning beyond the words themselves?'
  }
}
