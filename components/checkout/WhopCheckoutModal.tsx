'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { WhopCheckoutClient } from '@/app/checkout/WhopCheckoutClient'
import { BILLING_PLANS, type BillingPlanKey } from '@/lib/billing-plans'
import styles from './WhopCheckoutModal.module.css'

interface Props {
  email: string
  planKey: BillingPlanKey
  stateId?: string
  onClose: () => void
}

export function WhopCheckoutModal({ email, planKey, stateId, onClose }: Props) {
  const modalRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const plan = BILLING_PLANS[planKey]

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return

      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable?.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [onClose])

  return createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="whop-checkout-title"
      >
        <button
          ref={closeButtonRef}
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Close checkout"
        >
          <span aria-hidden>×</span>
        </button>

        <header className={styles.header}>
          <p className={styles.eyebrow}>Secure checkout with Whop</p>
          <h2 id="whop-checkout-title">{plan.label}</h2>
        </header>

        <div className={styles.checkout}>
          <WhopCheckoutClient
            email={email}
            planKey={plan.key}
            planId={plan.whopPlanId}
            planLabel={plan.label}
            stateId={stateId}
          />
        </div>

        <p className={styles.finePrint}>
          Payment and subscription management are securely handled by Whop.
        </p>
      </section>
    </div>,
    document.body
  )
}
