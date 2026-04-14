'use client'

import { CATEGORIES } from '@/lib/categories'

interface RadarChartProps {
  scores: {
    voice: number | null
    imagery: number | null
    structure: number | null
    pacing: number | null
  }
  size?: number
  showLabels?: boolean
  className?: string
}

const DIMENSIONS = [
  { key: 'voice' as const, angle: -90 },
  { key: 'structure' as const, angle: 0 },
  { key: 'pacing' as const, angle: 90 },
  { key: 'imagery' as const, angle: 180 },
]

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

export function RadarChart({ scores, size = 200, showLabels = true, className }: RadarChartProps) {
  const cx = size / 2
  const cy = size / 2
  const maxR = size * 0.36
  const labelR = size * 0.46

  const gridLevels = [25, 50, 75, 100]

  const points = DIMENSIONS.map(({ key, angle }) => {
    const value = scores[key] ?? 0
    const r = (value / 100) * maxR
    return polarToCartesian(cx, cy, r, angle)
  })

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ overflow: 'visible' }}
    >
      {gridLevels.map((level) => {
        const r = (level / 100) * maxR
        const gridPoints = DIMENSIONS.map(({ angle }) => {
          const p = polarToCartesian(cx, cy, r, angle)
          return `${p.x},${p.y}`
        }).join(' ')
        return (
          <polygon
            key={level}
            points={gridPoints}
            fill="none"
            stroke="var(--line)"
            strokeWidth={level === 100 ? 1 : 0.5}
            opacity={0.5}
          />
        )
      })}

      {DIMENSIONS.map(({ angle }) => {
        const end = polarToCartesian(cx, cy, maxR, angle)
        return (
          <line
            key={angle}
            x1={cx}
            y1={cy}
            x2={end.x}
            y2={end.y}
            stroke="var(--line)"
            strokeWidth={0.5}
            opacity={0.4}
          />
        )
      })}

      <polygon
        points={polygonPoints}
        fill="var(--accent)"
        fillOpacity={0.15}
        stroke="var(--accent)"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {DIMENSIONS.map(({ key, angle }, i) => {
        const value = scores[key]
        if (value === null) return null
        return (
          <circle
            key={key}
            cx={points[i].x}
            cy={points[i].y}
            r={3.5}
            fill={CATEGORIES[key].color}
            stroke="var(--paper)"
            strokeWidth={1.5}
          />
        )
      })}

      {showLabels &&
        DIMENSIONS.map(({ key, angle }) => {
          const config = CATEGORIES[key]
          const pos = polarToCartesian(cx, cy, labelR, angle)
          const value = scores[key]
          return (
            <g key={key}>
              <text
                x={pos.x}
                y={pos.y - 6}
                textAnchor="middle"
                dominantBaseline="central"
                style={{
                  fontSize: '0.6rem',
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fill: config.color,
                  fontWeight: 600,
                }}
              >
                {config.label}
              </text>
              {value !== null && (
                <text
                  x={pos.x}
                  y={pos.y + 8}
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)',
                    fill: 'var(--ink-muted)',
                    fontWeight: 500,
                  }}
                >
                  {value}
                </text>
              )}
            </g>
          )
        })}
    </svg>
  )
}
