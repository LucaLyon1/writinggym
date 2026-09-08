import { useState, useEffect } from 'react'
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
  const [cache] = useState(() => new Map<string, ExtractAnalysis>())
  const [result, setResult] = useState<{
    key: string
    analysis: ExtractAnalysis | null
    error: string | null
  } | null>(null)
  const key = JSON.stringify([extractId, text, constraint])
  const enabled = Boolean(extractId && text && constraint)

  if (result && result.key !== key) setResult(null)

  useEffect(() => {
    if (!enabled || cache.has(key)) return
    const controller = new AbortController()

    async function fetchAnalysis() {
      try {
        const res = await fetch('/api/analyse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ extractId, text, constraint }),
          signal: controller.signal,
        })

        if (!res.ok) {
          const data = (await res.json()) as { error?: string }
          throw new Error(data.error ?? `Request failed with status ${res.status}`)
        }

        const analysis = (await res.json()) as ExtractAnalysis
        if (controller.signal.aborted) return

        // Bound retained analyses while keeping different exercises distinct.
        if (cache.size >= 20) cache.delete(cache.keys().next().value!)
        cache.set(key, analysis)
        setResult({ key, analysis, error: null })
      } catch (err) {
        if (controller.signal.aborted) return
        setResult({
          key,
          analysis: null,
          error: err instanceof Error ? err.message : 'Failed to analyse extract',
        })
      }
    }

    void fetchAnalysis()
    return () => controller.abort()
  }, [cache, key, enabled, extractId, text, constraint])

  // Derive loading from the inputs so a previous exercise never flashes.
  const current = enabled && result?.key === key ? result : null
  const analysis = enabled ? cache.get(key) ?? current?.analysis ?? null : null
  const error = analysis ? null : current?.error ?? null
  return { analysis, isLoading: enabled && !analysis && !error, error }
}
