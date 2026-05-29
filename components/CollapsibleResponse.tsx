'use client'

import { useLayoutEffect, useRef, useState } from 'react'

export function CollapsibleResponse({
  label,
  text,
}: {
  label: string
  text: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  // Only show the toggle when the clamped passage actually overflows 3 lines.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => {
      if (!expanded) setOverflows(el.scrollHeight > el.clientHeight + 1)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [text, expanded])

  return (
    <div className="ea-feedback-user-text">
      <span className="ea-feedback-section-label">{label}</span>
      <p
        ref={ref}
        className={`ea-feedback-user-passage${expanded ? '' : ' ea-feedback-user-passage-clamped'}`}
      >
        &ldquo;{text}&rdquo;
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          className="ea-feedback-expand"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}
