'use client'

import Link from 'next/link'
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
              <div className="home-playground-cta">
                <p className="home-playground-cta-text">
                  Prefer to practice on your own passage? The playground is where
                  you paste text and get coaching without picking an extract.
                </p>
                <Link href="/playground" className="btn-primary home-playground-cta-btn">
                  Open the playground
                </Link>
              </div>
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
