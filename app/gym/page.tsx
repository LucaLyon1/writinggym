'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { Passage } from '@/data/passages'
import { passages } from '@/data/passages'
import { ExtractBrowser } from '@/components/ExtractBrowser'
import { AnalysisView } from '@/components/AnalysisView'

export default function GymPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const passageId = searchParams.get('passage')
  const [selectedPassage, setSelectedPassage] = useState<Passage | null>(() =>
    passageId ? passages.find((p) => p.id === passageId) ?? null : null
  )

  useEffect(() => {
    if (passageId) {
      const p = passages.find((x) => x.id === passageId)
      setSelectedPassage(p ?? null)
    } else {
      setSelectedPassage(null)
    }
  }, [passageId])

  function handleBack() {
    setSelectedPassage(null)
    router.replace('/gym')
  }

  if (selectedPassage) {
    return (
      <AnalysisView
        key={selectedPassage.id}
        passage={selectedPassage}
        onBack={handleBack}
      />
    )
  }

  return <ExtractBrowser onSelect={setSelectedPassage} />
}
