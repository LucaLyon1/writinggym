'use client'

import { useState } from 'react'
import type { Passage } from '@/data/passages'
import { ExtractBrowser } from '@/components/ExtractBrowser'
import { AnalysisView } from '@/components/AnalysisView'

export default function Page() {
  const [selectedPassage, setSelectedPassage] = useState<Passage | null>(null)

  if (selectedPassage) {
    return (
      <AnalysisView
        key={selectedPassage.id}
        passage={selectedPassage}
        onBack={() => setSelectedPassage(null)}
      />
    )
  }

  return <ExtractBrowser onSelect={setSelectedPassage} />
}
