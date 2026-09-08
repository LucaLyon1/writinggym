import '../scripts/test-dom.mts'
import assert from 'node:assert/strict'
import { afterEach, beforeEach, test, mock } from 'node:test'
import { act, cleanup, renderHook } from '@testing-library/react'
import { useSpeech } from './useSpeech.ts'

class FakeAudio {
  static instances: FakeAudio[] = []
  static rejectPlay = false
  onplay: (() => void) | null = null
  onended: (() => void) | null = null
  onerror: (() => void) | null = null
  paused = false
  srcRemoved = false
  constructor() { FakeAudio.instances.push(this) }
  async play() {
    if (FakeAudio.rejectPlay) throw new Error('Playback blocked')
    this.onplay?.()
  }
  pause() { this.paused = true }
  removeAttribute() { this.srcRemoved = true }
  load() {}
}

beforeEach(() => {
  FakeAudio.instances = []
  FakeAudio.rejectPlay = false
  Object.defineProperty(globalThis, 'Audio', { configurable: true, value: FakeAudio })
  mock.method(URL, 'createObjectURL', () => 'blob:test-audio')
  mock.method(URL, 'revokeObjectURL', () => {})
  mock.method(globalThis, 'fetch', async () => new Response(new Blob(['audio'])))
})
afterEach(() => {
  cleanup()
  mock.restoreAll()
  Reflect.deleteProperty(globalThis, 'Audio')
})

for (const finish of ['stop', 'unmount', 'ended', 'error'] as const) {
  test(`${finish} releases audio and its object URL`, async () => {
    const revoke = mock.method(URL, 'revokeObjectURL', () => {})
    const { result, unmount } = renderHook(useSpeech)
    await act(async () => { await result.current.speak('Read this.') })
    assert.equal(result.current.speaking, true)
    const audio = FakeAudio.instances[0]
    act(() => {
      if (finish === 'stop') result.current.stop()
      else if (finish === 'unmount') unmount()
      else if (finish === 'ended') audio.onended?.()
      else audio.onerror?.()
    })
    assert.equal(audio.paused, true)
    assert.equal(audio.srcRemoved, true)
    assert.equal(audio.onplay, null)
    assert.equal(revoke.mock.callCount(), 1)
    if (finish !== 'unmount') {
      assert.equal(result.current.speaking, false)
      assert.equal(result.current.loading, false)
    }
  })
}

test('a canceled request cannot clear the replacement request loading state', async () => {
  const signals: AbortSignal[] = []
  mock.method(globalThis, 'fetch', (_url: unknown, init: RequestInit) => {
    const signal = init.signal as AbortSignal
    signals.push(signal)
    return new Promise<Response>((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })
  })
  const { result } = renderHook(useSpeech)
  await act(async () => { void result.current.speak('First') })
  await act(async () => { void result.current.speak('Second') })
  assert.equal(signals[0].aborted, true)
  assert.equal(signals[1].aborted, false)
  assert.equal(result.current.loading, true)
  assert.equal(result.current.speaking, false)
})

test('stopping while the response body loads prevents late playback', async () => {
  let resolveBlob!: (blob: Blob) => void
  const body = new Promise<Blob>(resolve => { resolveBlob = resolve })
  mock.method(globalThis, 'fetch', async () => ({ ok: true, blob: () => body }))
  const { result } = renderHook(useSpeech)
  await act(async () => { void result.current.speak('First') })
  act(() => result.current.stop())
  await act(async () => { resolveBlob(new Blob(['late audio'])) })
  assert.equal(FakeAudio.instances.length, 0)
  assert.equal(result.current.loading, false)
})

test('rejected playback releases the object URL', async () => {
  FakeAudio.rejectPlay = true
  mock.method(console, 'error', () => {})
  const revoke = mock.method(URL, 'revokeObjectURL', () => {})
  const { result } = renderHook(useSpeech)
  await act(async () => { await result.current.speak('Read this.') })
  assert.equal(result.current.loading, false)
  assert.equal(result.current.speaking, false)
  assert.equal(revoke.mock.callCount(), 1)
})
