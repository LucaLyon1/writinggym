'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export function CollapsibleResponse({
  label,
  text,
}: {
  label: string
  text: string
}) {
  const [open, setOpen] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  // Only show the toggle when the clamped passage actually overflows 3 lines.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => setOverflows(el.scrollHeight > el.clientHeight + 1)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [text])

  // Close the popup on Escape.
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  return (
    <>
      <div className="ea-feedback-user-text">
        <span className="ea-feedback-section-label">{label}</span>
        <p ref={ref} className="ea-feedback-user-passage ea-feedback-user-passage-clamped">
          &ldquo;{text}&rdquo;
        </p>
        {overflows && (
          <button
            type="button"
            className="ea-feedback-expand"
            onClick={() => setOpen(true)}
          >
            Read full response
          </button>
        )}
      </div>

      {open && (
        <div className="sc-overlay" onClick={() => setOpen(false)}>
          <div className="submission-preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="sc-close" onClick={() => setOpen(false)} aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="2" y1="2" x2="12" y2="12" />
                <line x1="12" y1="2" x2="2" y2="12" />
              </svg>
            </button>
            <span className="ea-feedback-section-label">{label}</span>
            <p className="submission-preview-text">{text}</p>
          </div>
        </div>
      )}
    </>
  )
}
