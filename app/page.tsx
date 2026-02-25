'use client'

import { useRouter } from 'next/navigation'
import type { Passage } from '@/data/passages'
import { ExtractBrowser } from '@/components/ExtractBrowser'

export default function HomePage() {
  const router = useRouter()

  function handleSelect(passage: Passage) {
    router.push(`/extract/${passage.id}`)
  }

  return <ExtractBrowser onSelect={handleSelect} />
}
