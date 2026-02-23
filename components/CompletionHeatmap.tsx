'use client'

import { useMemo, useState } from 'react'

type Completion = { completed_at: string }

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 5) return 3
  return 4
}

export function CompletionHeatmap({ completions }: { completions: Completion[] }) {
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null)

  const countByDate = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of completions) {
      if (!c.completed_at) continue
      const d = new Date(c.completed_at)
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      map.set(date, (map.get(date) ?? 0) + 1)
    }
    return map
  }, [completions])

  const { grid, weekLabels } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const totalDays = 365
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - totalDays + 1)

    const startDayOfWeek = startDate.getDay()
    const gridStart = new Date(startDate)
    gridStart.setDate(gridStart.getDate() - startDayOfWeek)

    const weeks = 53
    const grid: { date: Date; count: number; isEmpty: boolean }[][] = []

    for (let col = 0; col < weeks; col++) {
      const column: { date: Date; count: number; isEmpty: boolean }[] = []
      for (let row = 0; row < 7; row++) {
        const cellDate = new Date(gridStart)
        cellDate.setDate(gridStart.getDate() + col * 7 + row)
        const isInRange = cellDate >= startDate && cellDate <= today
        const key = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`
        column.push({
          date: cellDate,
          count: isInRange ? countByDate.get(key) ?? 0 : 0,
          isEmpty: !isInRange,
        })
      }
      grid.push(column)
    }

    return { grid }
  }, [countByDate])

  return (
    <section className="heatmap-section" aria-label="Daily completions">
      <h2 className="heatmap-title">Activity</h2>
      <div className="heatmap-wrapper">
        <div className="heatmap-weekdays" aria-hidden>
          {WEEKDAYS.map((d) => (
            <span key={d} className="heatmap-weekday">
              {d}
            </span>
          ))}
        </div>
        <div className="heatmap-grid-wrap">
          <div className="heatmap-grid">
            {grid.map((column, colIdx) => (
              <div key={colIdx} className="heatmap-column">
                {column.map((cell, rowIdx) => {
                  const level = cell.isEmpty ? 0 : getLevel(cell.count)
                  const dateStr = cell.date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })
                  return (
                    <div
                      key={rowIdx}
                      className={`heatmap-cell heatmap-cell-${level}`}
                      data-empty={cell.isEmpty}
                      data-count={cell.count}
                      onMouseEnter={(e) => {
                        if (cell.isEmpty) return
                        const rect = e.currentTarget.getBoundingClientRect()
                        setTooltip({
                          date: dateStr,
                          count: cell.count,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        })
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      title={cell.isEmpty ? undefined : `${cell.count} completion${cell.count !== 1 ? 's' : ''} on ${dateStr}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="heatmap-legend">
        <span className="heatmap-legend-label">Less</span>
        <div className="heatmap-legend-swatches">
          {[0, 1, 2, 3, 4].map((level) => (
            <div key={level} className={`heatmap-legend-cell heatmap-cell-${level}`} />
          ))}
        </div>
        <span className="heatmap-legend-label">More</span>
      </div>
      {tooltip && (
        <div
          className="heatmap-tooltip"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <strong>{tooltip.count} completion{tooltip.count !== 1 ? 's' : ''}</strong>
          <span>{tooltip.date}</span>
        </div>
      )}
    </section>
  )
}
