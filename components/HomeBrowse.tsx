'use client'

import { useRouter } from 'next/navigation'
import type { Passage } from '@/data/passages'
import { ExtractBrowser } from '@/components/ExtractBrowser'

export function HomeBrowse() {
  const router = useRouter()

  function handleSelect(passage: Passage) {
    router.push(`/extract/${passage.id}`)
  }

  return (
    <div className="home-gallery-shell">
      <div className="home-gallery-main">
        <ExtractBrowser onSelect={handleSelect} />
      </div>
    </div>
  )
}
