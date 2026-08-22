import type { ReactNode } from 'react'
import styles from './ComingSoonCover.module.css'

export function ComingSoonCover({ active, children }: { active: boolean; children: ReactNode }) {
  if (!active) return children

  return (
    <div className={styles.wrap}>
      <div className={styles.blur} aria-hidden>
        {children}
      </div>
      <div className={styles.veil}>
        <div className={styles.popup} role="status">
          Coming Soon
        </div>
      </div>
    </div>
  )
}
