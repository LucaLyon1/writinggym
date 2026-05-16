const MIN_LEN = 3
const MAX_LEN = 32
const USERNAME_PATTERN = /^[a-z0-9_-]+$/

export function validateUsername(raw: unknown):
  | { ok: true; username: string }
  | { ok: false; error: string } {
  if (raw == null || typeof raw !== 'string') {
    return { ok: false, error: 'Username is required' }
  }
  const trimmed = raw.trim().toLowerCase()
  if (trimmed.length < MIN_LEN || trimmed.length > MAX_LEN) {
    return {
      ok: false,
      error: `Username must be between ${MIN_LEN} and ${MAX_LEN} characters`,
    }
  }
  if (!USERNAME_PATTERN.test(trimmed)) {
    return {
      ok: false,
      error: 'Username may only contain letters, numbers, underscores, and hyphens',
    }
  }
  return { ok: true, username: trimmed }
}

/** Derive a safe username from an email address, with a random suffix to avoid collisions. */
export function generateUsernameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? ''
  const base = local.toLowerCase().replace(/[^a-z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '')
  const suffix = Math.random().toString(36).slice(2, 7)
  const safeBase = base.length >= 2 ? base : 'user'
  return `${safeBase}_${suffix}`.slice(0, MAX_LEN)
}
