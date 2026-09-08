import '../scripts/test-dom.mts'
import assert from 'node:assert/strict'
import { afterEach, test, mock } from 'node:test'
import { act, cleanup, renderHook } from '@testing-library/react'
import { useExtractAnalysis } from './useExtractAnalysis.ts'
import type { ExtractAnalysis } from '../types/extract.ts'

afterEach(() => {
  cleanup()
  mock.restoreAll()
})

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}

const first = { extractId: 'passage-a', text: 'First passage.', constraint: 'Use short sentences.' }
const second = { ...first, constraint: 'Use long sentences.' }
const analysis = (constraint: string): ExtractAnalysis => ({
  segments: [{ text: first.text }], summary: ['Craft lesson.'], constraint, source: 'Test',
})
const constraintOf = (value: ExtractAnalysis | null) => value?.constraint

test('changing the constraint fetches a distinct analysis and ignores a late response', async () => {
  const requests: { response: ReturnType<typeof deferred<Response>>; signal: AbortSignal }[] = []
  mock.method(globalThis, 'fetch', (_url: unknown, init: RequestInit) => {
    const response = deferred<Response>()
    requests.push({ response, signal: init.signal as AbortSignal })
    return response.promise
  })
  const { result, rerender } = renderHook(useExtractAnalysis, { initialProps: first })
  assert.equal(result.current.isLoading, true)
  rerender(second)
  assert.equal(requests.length, 2)
  assert.equal(requests[0].signal.aborted, true)
  assert.deepEqual(result.current.analysis, null)

  await act(async () => { requests[1].response.resolve(Response.json(analysis('Second'))) })
  await act(async () => { requests[0].response.resolve(Response.json(analysis('Stale'))) })
  assert.equal(constraintOf(result.current.analysis), 'Second')
  assert.equal(result.current.isLoading, false)
})

test('revisiting a cached exercise cancels pending work and clears loading', async () => {
  const pending = deferred<Response>()
  let signal: AbortSignal | undefined
  const fetchMock = mock.method(globalThis, 'fetch', (_url: unknown, init: RequestInit) => {
    if (JSON.parse(init.body as string).constraint === first.constraint) {
      return Promise.resolve(Response.json(analysis('Cached')))
    }
    signal = init.signal as AbortSignal
    return pending.promise
  })
  const { result, rerender } = renderHook(useExtractAnalysis, { initialProps: first })
  await act(async () => {})
  rerender(second)
  assert.deepEqual(result.current.analysis, null)
  assert.equal(result.current.isLoading, true)
  rerender(first)
  assert.equal(constraintOf(result.current.analysis), 'Cached')
  assert.equal(result.current.isLoading, false)
  assert.equal(signal?.aborted, true)
  assert.equal(fetchMock.mock.callCount(), 2)
})

test('text changes invalidate the cache and unmount cancels the request', async () => {
  const signals: AbortSignal[] = []
  mock.method(globalThis, 'fetch', (_url: unknown, init: RequestInit) => {
    signals.push(init.signal as AbortSignal)
    return Promise.resolve(Response.json(analysis('Original')))
  })
  const { rerender, unmount } = renderHook(useExtractAnalysis, { initialProps: first })
  await act(async () => {})
  rerender({ ...first, text: 'Edited passage.' })
  assert.equal(signals.length, 2)
  unmount()
  assert.equal(signals[1].aborted, true)
  await act(async () => {})
})

test('missing inputs do not fetch or retain a previous result', async () => {
  const fetchMock = mock.method(globalThis, 'fetch', async () => Response.json(analysis('Original')))
  const { result, rerender } = renderHook(useExtractAnalysis, { initialProps: first })
  await act(async () => {})
  rerender({ ...first, text: '' })
  assert.deepEqual(result.current, { analysis: null, isLoading: false, error: null })
  assert.equal(fetchMock.mock.callCount(), 1)
})

test('an error can be retried after changing exercises', async () => {
  const fetchMock = mock.method(globalThis, 'fetch', async () => Response.json({ error: 'Try again' }, { status: 502 }))
  const { result, rerender } = renderHook(useExtractAnalysis, { initialProps: first })
  await act(async () => {})
  assert.equal(result.current.error, 'Try again')
  rerender(second)
  rerender(first)
  assert.equal(result.current.error, null)
  assert.equal(result.current.isLoading, true)
  await act(async () => {})
  assert.equal(fetchMock.mock.callCount(), 3)
})
