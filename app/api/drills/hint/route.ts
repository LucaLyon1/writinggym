import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { WRITTEN_HINT_SCHEMA, checkMove, describeConstraints, firstBrokenRule, type WrittenHint } from '@/lib/drill-moves'
import { describeMove, resolveWrittenMove } from '../resolve'

const SYSTEM_PROMPT = `You are the coach inside a writing-drills game. Writers practice "scales": tiny puzzles where each move is usually one sentence that must execute a technique. Some moves rewrite a given sentence.

The writer is stuck on the next move and asked for help before writing it. Help them get started, the way a chess hint shows which piece to move.

Fields:
- action: one concrete instruction in the imperative, at most 20 words, that the writer can act on right now for this move and this subject: what to look at, what to name, which word or structure to open with. Not a definition of the technique. Like "Name the first sound the keeper hears, in four words." or "Open with the verb, then add the place."
- solution: one possible move that executes the technique and meets every constraint. For a passage, it continues the earlier moves naturally. Plain and clean rather than showy: a model the writer can learn from, then write their own. Only the move itself, no quotes or commentary.`

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not set.' }, { status: 500 })
  }

  let input: Record<string, unknown>
  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const context = resolveWrittenMove(input)
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 400 })
  const { move, previous } = context
  const sentences = move.sentences ?? 1

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `${describeMove(context)}

Constraints the move must meet: ${describeConstraints(move.rules, sentences).join('; ')}.`,
    },
  ]

  const client = new Anthropic({ apiKey })
  try {
    // The solution must pass the same instant rules as the writer's move; one retry if it does not.
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        output_config: { format: { type: 'json_schema', schema: WRITTEN_HINT_SCHEMA } },
        messages,
      })
      const text = response.content.find((b) => b.type === 'text')?.text ?? ''
      const hint = parseHint(text)
      if (!hint) continue
      const broken = firstBrokenRule(checkMove(move.rules, hint.solution, previous, sentences))
      if (!broken || attempt === 1) return NextResponse.json(hint)
      messages.push(
        { role: 'assistant', content: text },
        { role: 'user', content: `Your solution breaks a constraint: ${broken.reason} Fix it and answer again.` }
      )
    }
  } catch (err) {
    console.error('[drills/hint] error:', err)
  }
  return NextResponse.json({ error: 'The coach is unavailable. Try again.' }, { status: 502 })
}

function parseHint(text: string): WrittenHint | null {
  try {
    const data = JSON.parse(text)
    const action = typeof data.action === 'string' ? data.action.trim() : ''
    const solution = typeof data.solution === 'string' ? data.solution.trim().replace(/^[“"]|[”"]$/g, '') : ''
    return action && solution ? { action, solution } : null
  } catch {
    return null
  }
}
