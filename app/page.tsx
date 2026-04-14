'use client'

import { useRouter } from 'next/navigation'
import type { Passage } from '@/data/passages'
import { ExtractBrowser } from '@/components/ExtractBrowser'
import { Onboarding } from '@/components/Onboarding'

function HomeContent() {
  const router = useRouter()

  function handleSelect(passage: Passage) {
    router.push(`/extract/${passage.id}`)
  }

  return (
    <div className="home-gallery-shell">
      <div className="home-gallery-main">
        <ExtractBrowser
          onSelect={handleSelect}
          hero={
            <div className="home-hero home-gallery-hero">
              <h1 className="home-title">Deliberate practice for writers</h1>
              <p className="home-subtitle">
                Browse passages from masters. Open an extract, rewrite it, get
                coached.
              </p>
            </div>
          }
        />
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <>
      <Onboarding />
      <HomeContent />
    </>
  )
}
