import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExtractAnalysis } from '@/types/extract'

interface UseExtractAnalysisParams {
  extractId: string
  text: string
  constraint: string
}

interface UseExtractAnalysisResult {
  analysis: ExtractAnalysis | null
  isLoading: boolean
  error: string | null
}

export function useExtractAnalysis({
  extractId,
  text,
  constraint,
}: UseExtractAnalysisParams): UseExtractAnalysisResult {
  const [analysis, setAnalysis] = useState<ExtractAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cacheRef = useRef<Record<string, ExtractAnalysis>>({})

  const fetchAnalysis = useCallback(async () => {
    if (cacheRef.current[extractId]) {
      setAnalysis(cacheRef.current[extractId])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractId, text, constraint }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? `Request failed with status ${res.status}`)
      }

      const data = (await res.json()) as ExtractAnalysis
      cacheRef.current[extractId] = data
      setAnalysis(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyse extract')
    } finally {
      setIsLoading(false)
    }
  }, [extractId, text, constraint])

  useEffect(() => {
    if (text && constraint) {
      fetchAnalysis()
    }
  }, [fetchAnalysis, text, constraint])

  return { analysis, isLoading, error }
}
