'use client'

import type { Passage } from '@/data/passages'
import { categories } from '@/data/passages'
import { useExtractAnalysis } from '@/hooks/useExtractAnalysis'
import { ExtractAnalysis } from '@/components/ExtractAnalysis'

interface AnalysisViewProps {
  passage: Passage
  onBack: () => void
  initialUserText?: string
}

export function AnalysisView({ passage, onBack, initialUserText }: AnalysisViewProps) {
  const category = categories.find((c) => c.id === passage.categoryId)
  const constraint = passage.twists[0]?.prompt ?? passage.context

  const { analysis, isLoading, error } = useExtractAnalysis({
    extractId: passage.id,
    text: passage.text,
    constraint,
  })

  return (
    <div className="analysis-view">
      <ExtractAnalysis
        analysis={analysis}
        isLoading={isLoading}
        error={error}
        passageId={passage.id}
        constraint={constraint}
        categoryId={passage.categoryId}
        initialUserText={initialUserText}
        author={passage.author}
        title={passage.title}
        difficulty={passage.difficulty}
        categoryLabel={category?.label}
        onBack={onBack}
      />
    </div>
  )
}
