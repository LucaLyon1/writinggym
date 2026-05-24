'use client'

import { useMemo, useState } from 'react'

type Completion = { completed_at: string }

function getLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 5) return 3
  return 4
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()

  // Monday = 0, Sunday = 6
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const cells: { day: number | null; date: string | null }[] = []

  for (let i = 0; i < startDow; i++) {
    cells.push({ day: null, date: null })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, date: dateStr })
  }

  return cells
}

export function CompletionHeatmap({ completions }: { completions: Completion[] }) {
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())

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

  const grid = useMemo(
    () => getMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  )

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const monthTotal = grid.reduce((sum, cell) => {
    if (!cell.date) return sum
    return sum + (countByDate.get(cell.date) ?? 0)
  }, 0)

  const activeDays = grid.filter(
    (cell) => cell.date && (countByDate.get(cell.date) ?? 0) > 0
  ).length

  function goBack() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  function goForward() {
    if (isCurrentMonth) return
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  return (
    <section className="heatmap-section" aria-label="Activity calendar">
      <header className="heatmap-header">
        <button
          type="button"
          className="heatmap-nav-btn"
          onClick={goBack}
          aria-label="Previous month"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2L4 6l4 4" />
          </svg>
        </button>
        <h2 className="heatmap-month-label">{monthLabel}</h2>
        <button
          type="button"
          className="heatmap-nav-btn"
          onClick={goForward}
          disabled={isCurrentMonth}
          aria-label="Next month"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 2l4 4-4 4" />
          </svg>
        </button>
      </header>

      <div className="heatmap-calendar">
        <div className="heatmap-dow-row">
          {WEEKDAY_LABELS.map((d) => (
            <span key={d} className="heatmap-dow">{d}</span>
          ))}
        </div>
        <div className="heatmap-days">
          {grid.map((cell, i) => {
            if (!cell.date) {
              return <span key={i} className="heatmap-day heatmap-day-empty" />
            }
            const count = countByDate.get(cell.date) ?? 0
            const level = getLevel(count)
            const isFuture = cell.date > todayStr
            const isToday = cell.date === todayStr
            return (
              <span
                key={i}
                className={`heatmap-day heatmap-day-${level}${isToday ? ' heatmap-day-today' : ''}${isFuture ? ' heatmap-day-future' : ''}`}
                title={isFuture ? undefined : `${count} session${count !== 1 ? 's' : ''}`}
              >
                {cell.day}
              </span>
            )
          })}
        </div>
      </div>

      <div className="heatmap-stats">
        <div className="heatmap-stat">
          <span className="heatmap-stat-value">{monthTotal}</span>
          <span className="heatmap-stat-label">sessions</span>
        </div>
        <div className="heatmap-stat">
          <span className="heatmap-stat-value">{activeDays}</span>
          <span className="heatmap-stat-label">active days</span>
        </div>
      </div>

      <div className="heatmap-legend">
        <span className="heatmap-legend-label">Less</span>
        <div className="heatmap-legend-swatches">
          {[0, 1, 2, 3, 4].map((level) => (
            <div key={level} className={`heatmap-legend-cell heatmap-day-${level}`} />
          ))}
        </div>
        <span className="heatmap-legend-label">More</span>
      </div>
    </section>
  )
}
