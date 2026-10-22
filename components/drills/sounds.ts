/**
 * Game sounds for the drills page, synthesised with Web Audio (no assets).
 * The audio context is created on the first call, which always follows a
 * user gesture (playing a move), so browsers allow it to start.
 */
import type { MoveQuality } from '@/lib/drill-moves'

export type DrillSound = MoveQuality | 'place' | 'solved'

let ctx: AudioContext | null = null

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function note(
  ac: AudioContext,
  freq: number,
  at: number,
  duration: number,
  { type = 'sine', volume = 0.18 }: { type?: OscillatorType; volume?: number } = {}
) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, at)
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
  osc.connect(gain).connect(ac.destination)
  osc.start(at)
  osc.stop(at + duration + 0.02)
}

/** A short wooden "tock", like a piece set down on the board. */
function place(ac: AudioContext, at: number) {
  note(ac, 190, at, 0.07, { type: 'triangle', volume: 0.22 })
  note(ac, 95, at, 0.09, { type: 'sine', volume: 0.2 })
}

export function playSound(sound: DrillSound) {
  const ac = context()
  if (!ac) return
  const t = ac.currentTime + 0.01
  switch (sound) {
    case 'place':
      place(ac, t)
      break
    case 'good':
      note(ac, 659, t, 0.16)
      note(ac, 880, t + 0.09, 0.26)
      break
    case 'great':
      note(ac, 659, t, 0.14)
      note(ac, 880, t + 0.08, 0.14)
      note(ac, 1109, t + 0.16, 0.3)
      break
    case 'brilliant':
      ;[784, 988, 1175, 1568].forEach((f, i) => note(ac, f, t + i * 0.07, 0.28, { volume: 0.16 }))
      note(ac, 2349, t + 0.3, 0.45, { volume: 0.06 })
      break
    case 'inaccuracy':
      note(ac, 440, t, 0.14, { type: 'triangle', volume: 0.16 })
      note(ac, 392, t + 0.11, 0.22, { type: 'triangle', volume: 0.14 })
      break
    case 'mistake':
    case 'blunder':
      note(ac, 220, t, 0.14, { type: 'triangle', volume: 0.24 })
      note(ac, 165, t + 0.12, 0.28, { type: 'triangle', volume: 0.22 })
      break
    case 'solved':
      ;[523, 659, 784, 1047].forEach((f, i) => note(ac, f, t + i * 0.09, 0.3))
      ;[523, 659, 784].forEach((f) => note(ac, f * 2, t + 0.45, 0.7, { volume: 0.07 }))
      break
  }
}
