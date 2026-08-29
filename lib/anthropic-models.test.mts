import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from 'node:test'

const apiRoutes = [
  'app/api/assessment/route.ts',
  'app/api/chat/route.ts',
  'app/api/example/route.ts',
  'app/api/playground/route.ts',
  'app/api/playground-feedback/route.ts',
]

const retiredModel = 'claude-sonnet-4-20250514'
const currentModel = 'claude-sonnet-4-6'

test('writer-facing AI routes use the supported Sonnet model', () => {
  for (const route of apiRoutes) {
    const source = readFileSync(resolve(process.cwd(), route), 'utf8')

    assert.doesNotMatch(source, new RegExp(retiredModel))
    assert.match(source, new RegExp(currentModel))
  }
})
