export const PLAYGROUND_PASSAGE_PREFIX = 'playground:' as const

export function playgroundPassageId(promptId: string): string {
  return `${PLAYGROUND_PASSAGE_PREFIX}${promptId}`
}
