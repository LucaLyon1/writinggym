export type CraftCategory = 'structure' | 'voice' | 'imagery' | 'pacing'

export interface Annotation {
  category: CraftCategory
  note: string
}

export interface Segment {
  text: string
  annotation?: Annotation
}

export interface ExtractAnalysis {
  segments: Segment[]
  summary: string[]
  constraint: string
  source: string
}

export interface Extract {
  id: string
  title: string
  author: string
  analysis?: ExtractAnalysis
}
