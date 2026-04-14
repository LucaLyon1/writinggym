import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { checkAnalysisQuota, recordAnalysisRequest } from '@/lib/plan'
import { constraintKey } from '@/lib/constraint-key'

const SYSTEM_PROMPT = `You are helping a writer learn by imitation. You will receive:
- An ORIGINAL extract (a published literary passage)
- A CONSTRAINT (the writing exercise the user was given)

Your job: write a short passage that masterfully executes this constraint.

Requirements:
- Execute the constraint flawlessly. If it asks for a change (e.g. first person, different pacing, stripped imagery), do exactly that.
- Match the craft quality of the original: structure, voice, imagery, pacing — but only in ways that serve the constraint.
- Keep similar length (roughly the same word count as the original).
- Return ONLY the rewritten text. No preamble, no explanation, no markdown.`

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not set.' },
      { status: 500 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Sign in to use this feature.' },
      { status: 401 }
    )
  }

  const quota = await checkAnalysisQuota(user.id)
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: `You've used ${quota.used}/${quota.limit} analyses this week. Upgrade for unlimited access.`,
        quota: { used: quota.used, limit: quota.limit },
      },
      { status: 429 }
    )
  }

  const body = (await request.json()) as {
    originalText: string
    constraint: string
    passageId?: string
  }

  if (!body.originalText || !body.constraint) {
    return NextResponse.json(
      { error: 'Missing required fields: originalText, constraint' },
      { status: 400 }
    )
  }

  const client = new Anthropic({ apiKey })

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Original extract:\n\n${body.originalText}\n\nConstraint: ${body.constraint}\n\nWrite the perfect example (text only):`,
        },
      ],
    })

    const textBlock = message.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json(
        { error: 'No text response from Claude' },
        { status: 502 }
      )
    }

    const example = textBlock.text.trim()

    if (body.passageId) {
      await recordAnalysisRequest(user.id, body.passageId, constraintKey(body.constraint))
    }

    return NextResponse.json({ example })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `API error: ${msg}` },
      { status: 502 }
    )
  }
}
