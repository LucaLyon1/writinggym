'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { passages } from '@/data/passages'
import { AnalysisView } from '@/components/AnalysisView'

const DRAFT_KEY = 'rewrite-draft'

export default function ExtractPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const passage = passages.find((p) => p.id === slug)
  const [initialUserText] = useState(() => {
    const fromUrl = searchParams.get('userText') ?? undefined
    if (typeof window === 'undefined') return fromUrl
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY)
      if (raw) {
        const { pathname: storedPath, userText } = JSON.parse(raw) as {
          pathname: string
          userText: string
        }
        if (storedPath === `/extract/${slug}` && userText) {
          sessionStorage.removeItem(DRAFT_KEY)
          return userText
        }
      }
    } catch {
      // ignore parse errors
    }
    return fromUrl
  })

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
