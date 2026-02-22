'use client'

import { ExtractAnalysis } from '@/components/ExtractAnalysis'
import { useExtractAnalysis } from '@/hooks/useExtractAnalysis'

const DEMO_EXTRACT = {
  id: 'orwell-1984-opening',
  title: 'Nineteen Eighty-Four — Opening',
  author: 'George Orwell',
  text: 'It was a bright cold day in April, and the clocks were striking thirteen. Winston Smith, his chin nuzzled into his breast in an effort to escape the vile wind, slipped quickly through the glass doors of Victory Mansions, though not quickly enough to prevent a swirl of gritty dust from entering along with him.',
  constraint: 'Write an opening paragraph that establishes an unsettling normality — a world that feels almost like ours but with one dissonant detail that signals something is wrong.',
}

export default function Page() {
  const { analysis, isLoading, error } = useExtractAnalysis({
    extractId: DEMO_EXTRACT.id,
    text: DEMO_EXTRACT.text,
    constraint: DEMO_EXTRACT.constraint,
  })

  return (
    <ExtractAnalysis
      analysis={analysis}
      isLoading={isLoading}
      error={error}
    />
  )
}
