import type { StreakBadge } from '@/lib/streak-badges'

type Label = StreakBadge['label']

/** Medallion colours per level: greens while growing, then rust, then precious. */
const TONES: Record<Label, { fill: string; ink: string }> = {
  Sprout: { fill: '#e3ead6', ink: '#5f7f3e' },
  Herb: { fill: '#d6e3c4', ink: '#4f7330' },
  Oak: { fill: '#c4d6ad', ink: '#3d5f22' },
  Summit: { fill: '#d5dfe6', ink: '#46657a' },
  Champion: { fill: '#f0e0da', ink: '#b84a2e' },
  'On Fire': { fill: '#f3d2c2', ink: '#a8381c' },
  Diamond: { fill: '#cfeceb', ink: '#13807d' },
  Legend: { fill: '#f2e4c0', ink: '#8a6414' },
}

/** One simple line glyph per level, drawn in a 24×24 box. */
const GLYPHS: Record<Label, React.ReactNode> = {
  Sprout: (
    <>
      <path d="M12 19v-6" />
      <path d="M12 13c0-3 2-5 5-5 0 3-2 5-5 5Z" />
    </>
  ),
  Herb: (
    <>
      <path d="M12 19V9" />
      <path d="M12 14c-3 0-5-2-5-5 3 0 5 2 5 5Z" />
      <path d="M12 11c0-3 2-5 5-5 0 3-2 5-5 5Z" />
    </>
  ),
  Oak: (
    <>
      <path d="M12 19v-5" />
      <path d="M8.5 14a3.5 3.5 0 0 1-.8-6.9 4.5 4.5 0 0 1 8.6 0 3.5 3.5 0 0 1-.8 6.9Z" />
    </>
  ),
  Summit: (
    <>
      <path d="M4 18 10 8l3 5 2-3 5 8Z" />
      <path d="m8.2 11 1.8 1.2 1.6-1.4" />
    </>
  ),
  Champion: (
    <>
      <path d="M8 5h8v4a4 4 0 0 1-8 0Z" />
      <path d="M8 7H5.5a2.5 2.5 0 0 0 2.6 3M16 7h2.5a2.5 2.5 0 0 1-2.6 3" />
      <path d="M12 13v3M9 19h6M10 16h4v3h-4Z" />
    </>
  ),
  'On Fire': (
    <path d="M12 19c-3.3 0-5.5-2.2-5.5-5 0-2.6 1.8-4 2.8-6 .8 1.4 1.7 2 2.4 2.2C11.4 8 12.3 6 14 5c0 3 3.5 4.6 3.5 9 0 2.8-2.2 5-5.5 5Z" />
  ),
  Diamond: (
    <>
      <path d="M6 9.5 9 5.5h6l3 4-6 9Z" />
      <path d="M6 9.5h12M10 9.5l2 9 2-9M9 5.5l1 4M15 5.5l-1 4" />
    </>
  ),
  Legend: (
    <>
      <path d="m5 17-1-9 4.5 3.5L12 6l3.5 5.5L20 8l-1 9Z" />
      <path d="M5 17h14" />
    </>
  ),
}

type Props = {
  badge: StreakBadge
  size?: number
  locked?: boolean
  className?: string
}

/** A round medallion for a streak level. Decorative: label it at the call site. */
export function StreakBadgeIcon({ badge, size = 32, locked = false, className }: Props) {
  const tone = locked ? { fill: 'transparent', ink: 'var(--ink-faint)' } : TONES[badge.label]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={`streak-badge-icon${locked ? ' is-locked' : ''}${className ? ` ${className}` : ''}`}
    >
      <circle
        cx="16"
        cy="16"
        r="15"
        fill={tone.fill}
        stroke={tone.ink}
        strokeWidth="1.25"
        strokeDasharray={locked ? '2.5 2.5' : undefined}
      />
      <g
        transform="translate(4 4)"
        fill="none"
        stroke={tone.ink}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {GLYPHS[badge.label]}
      </g>
    </svg>
  )
}
