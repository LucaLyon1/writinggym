'use client'

import type { Passage } from '@/data/passages'
import { categories } from '@/data/passages'
import { useExtractAnalysis } from '@/hooks/useExtractAnalysis'
import { ExtractAnalysis } from '@/components/ExtractAnalysis'

interface AnalysisViewProps {
  passage: Passage
  onBack: () => void
}

export function AnalysisView({ passage, onBack }: AnalysisViewProps) {
  const category = categories.find((c) => c.id === passage.categoryId)
  const constraint = passage.twists[0]?.prompt ?? passage.context

  const { analysis, isLoading, error } = useExtractAnalysis({
    extractId: passage.id,
    text: passage.text,
    constraint,
  })

  return (
    <div className="analysis-view">
      <div className="analysis-topbar">
        <button className="back-btn" onClick={onBack}>
          ← Go back to library
        </button>
        {category && (
          <span className="gym-category-badge">{category.label}</span>
        )}
        <span className="analysis-topbar-title">
          {passage.author} — <em>{passage.title}</em>
        </span>
      </div>
      <ExtractAnalysis
        analysis={analysis}
        isLoading={isLoading}
        error={error}
        passageId={passage.id}
        constraint={constraint}
        categoryId={passage.categoryId}
      />
    </div>
  )
}
