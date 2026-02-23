import { createHash } from 'crypto'

export function constraintKey(constraint: string): string {
  return createHash('sha256').update(constraint.trim()).digest('hex')
}
