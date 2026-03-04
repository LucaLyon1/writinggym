'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { passages } from '@/data/passages'
import { AnalysisView } from '@/components/AnalysisView'

export default function ExtractPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const passage = passages.find((p) => p.id === slug)
  const initialUserText = searchParams.get('userText') ?? undefined

  useEffect(() => {
    if (slug && !passage) {
      router.replace('/')
    }
  }, [slug, passage, router])

  if (!passage) {
    return <div className="gym-loading">Loading…</div>
  }

  return (
    <AnalysisView
      key={passage.id}
      passage={passage}
      onBack={() => router.push('/')}
      initialUserText={initialUserText}
    />
  )
}
