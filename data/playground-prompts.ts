import type { CraftCategory } from '@/types/extract'

export interface CraftPlaygroundPrompt {
  id: string
  /** Which craft lens this exercise emphasizes */
  craft: CraftCategory
  /** Short exercise shape, e.g. dialogue, character intro */
  focus: string
  title: string
  prompt: string
}

export const craftPlaygroundPrompts: CraftPlaygroundPrompt[] = [
  {
    id: 'character-intro',
    craft: 'voice',
    focus: 'Character',
    title: 'First impression',
    prompt:
      'Introduce a character the moment they enter a room. Show who they are through action, dialogue, and one telling detail — not a physical checklist.',
  },
  {
    id: 'dialogue-subtext',
    craft: 'structure',
    focus: 'Dialogue',
    title: 'The unspoken',
    prompt:
      'Write a short exchange between two people where the most important thing is never said aloud.',
  },
  {
    id: 'dialogue-voice',
    craft: 'voice',
    focus: 'Dialogue',
    title: 'Two distinct voices',
    prompt:
      'Write a conversation of at least six lines. Make each speaker sound unmistakably different — rhythm, vocabulary, what they leave unsaid.',
  },
  {
    id: 'sensory-place',
    craft: 'imagery',
    focus: 'Place',
    title: 'A childhood place',
    prompt:
      'Write about a place from your childhood using only sensory details — what you saw, heard, smelled, touched, tasted.',
  },
  {
    id: 'morning',
    craft: 'imagery',
    focus: 'Observation',
    title: 'The morning light',
    prompt:
      'Describe the first thing you see when you wake up, as if noticing it for the very first time.',
  },
  {
    id: 'stranger',
    craft: 'voice',
    focus: 'Observation',
    title: 'A stranger observed',
    prompt:
      'You are sitting in a café. Describe a stranger who walks in — without using any adjectives about their personality.',
  },
  {
    id: 'weather-mirror',
    craft: 'imagery',
    focus: 'Metaphor',
    title: 'The storm inside',
    prompt:
      'Describe a thunderstorm, but make it mirror an emotional state you have felt recently.',
  },
  {
    id: 'object-history',
    craft: 'imagery',
    focus: 'Symbol',
    title: 'An ordinary object',
    prompt:
      'Pick an everyday object — a key, a cup, a shoe — and write about it as though it holds the entire history of a person.',
  },
  {
    id: 'walk-dusk',
    craft: 'pacing',
    focus: 'Scene',
    title: 'A walk at dusk',
    prompt:
      'You are walking through your neighbourhood at dusk. Write what you notice in the order you notice it.',
  },
  {
    id: 'waiting',
    craft: 'pacing',
    focus: 'Time',
    title: 'Waiting',
    prompt:
      'Describe the experience of waiting — in a queue, a hospital, an airport — and make the reader feel the weight of time.',
  },
  {
    id: 'meal',
    craft: 'imagery',
    focus: 'Scene',
    title: 'A meal remembered',
    prompt:
      'Write about a meal that mattered. Focus on the food, the setting, and one detail that made it unforgettable.',
  },
  {
    id: 'door',
    craft: 'structure',
    focus: 'Scene beat',
    title: 'Behind the door',
    prompt:
      'A character opens a door they have been avoiding. Describe only what they see, hear, and feel in the first five seconds.',
  },
  {
    id: 'sentence-rhythm',
    craft: 'structure',
    focus: 'Syntax',
    title: 'Long and short',
    prompt:
      'Write one paragraph about a small moment of tension. Use at least one very long sentence and one sentence of five words or fewer.',
  },
  {
    id: 'interior-monologue',
    craft: 'voice',
    focus: 'Interiority',
    title: 'Inside one mind',
    prompt:
      'Stay in one character’s head for a full paragraph as they make a decision they don’t want to make. No dialogue.',
  },
  {
    id: 'time-shift',
    craft: 'pacing',
    focus: 'Structure',
    title: 'Then and now',
    prompt:
      'Alternate between two moments in time — the same location, years apart — in short beats. No more than three sentences per beat.',
  },
  {
    id: 'action-scene',
    craft: 'pacing',
    focus: 'Momentum',
    title: 'Something goes wrong',
    prompt:
      'Write a sequence where a simple plan falls apart in under two minutes of story time. Prioritise motion and consequence over explanation.',
  },
]
