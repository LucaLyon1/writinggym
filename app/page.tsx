'use client'

import { useRouter } from 'next/navigation'
import type { Passage } from '@/data/passages'
import { ExtractBrowser } from '@/components/ExtractBrowser'
import { Onboarding } from '@/components/Onboarding'

export default function HomePage() {
  const router = useRouter()

  function handleSelect(passage: Passage) {
    router.push(`/extract/${passage.id}`)
  }

  return (
    <>
      <Onboarding />
      <ExtractBrowser onSelect={handleSelect} />
    </>
  )
}
