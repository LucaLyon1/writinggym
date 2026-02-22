import type { CraftCategory } from '@/types/extract'

interface CategoryConfig {
  label: string
  color: string
  bg: string
  border: string
  description: string
}

export const CATEGORIES: Record<CraftCategory, CategoryConfig> = {
  structure: {
    label: 'Structure',
    color: '#E8C547',
    bg: 'rgba(232,197,71,0.15)',
    border: 'rgba(232,197,71,0.45)',
    description: 'How sentences are built — length, syntax, rhythm',
  },
  voice: {
    label: 'Voice',
    color: '#7EB8F7',
    bg: 'rgba(126,184,247,0.15)',
    border: 'rgba(126,184,247,0.45)',
    description: 'Personality and point of view bleeding through word choice',
  },
  imagery: {
    label: 'Imagery',
    color: '#A8E6A3',
    bg: 'rgba(168,230,163,0.15)',
    border: 'rgba(168,230,163,0.45)',
    description: 'Concrete sensory detail that makes the abstract visible',
  },
  pacing: {
    label: 'Pacing',
    color: '#F4A87C',
    bg: 'rgba(244,168,124,0.15)',
    border: 'rgba(244,168,124,0.45)',
    description: 'The speed of information — how fast or slow you read',
  },
} as const
