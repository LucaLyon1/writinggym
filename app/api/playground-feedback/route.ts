import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are a literary craft analyst giving honest, constructive feedback on a piece of writing.

You will receive a writing sample from a user. There is no prompt or exercise — they wrote freely.

Your job is to evaluate the prose on craft dimensions and give useful feedback.

SCORING

Score each criterion from 0–100. All four are always in play for freetext.

- voice: Does the writer establish a tonal personality through diction and attitude?
- imagery: Quality and specificity of sensory detail.
- structure: Sentence construction and rhythm.
- pacing: Control of narrative speed and emphasis.

Calibration:
60 = understandable
70 = competent
85 = strong, deliberate craft control
90+ = exceptional
Below 25 = barely attempts the task

Be honest. Do not flatter.

FEEDBACK

Write 2–4 paragraphs of constructive critique. Cite specific phrases. Be precise.

VERDICT

One punchy sentence (max 12 words) summarizing the overall impression.

ACTIONABLE OBSERVATION

One concrete, specific thing the writer could try next. Not generic advice — something tied to this piece.

Return valid JSON only (no markdown, no preamble):

{
  "scores": {
    "voice": 0-100,
    "imagery": 0-100,
    "structure": 0-100,
    "pacing": 0-100,
    "constraint": null
  },
  "feedback": "2–4 paragraph critique.",
  "verdict": "Short headline verdict.",
  "actionable_observation": "One specific suggestion."
}`

function stripMarkdownFences(raw: string): string {
  let cleaned = raw.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '')
    cleaned = cleaned.replace(/\n?```\s*$/, '')
  }
  return cleaned.trim()
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not set.' },
      { status: 500 }
    )
  }

  const body = (await request.json()) as { text: string }

  if (!body.text?.trim()) {
    return NextResponse.json(
      { error: 'Missing text.' },
      { status: 400 }
    )
  }

  const wordCount = body.text.trim().split(/\s+/).length
  if (wordCount < 30) {
    return NextResponse.json(
      { error: 'Write at least 30 words for feedback.' },
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
          content: `Here is the writing:\n\n${body.text}`,
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

    const cleaned = stripMarkdownFences(textBlock.text)

    try {
      const result = JSON.parse(cleaned)
      return NextResponse.json({
        ...result,
        segments: [],
        divergences: { voice: null, imagery: null, structure: null, pacing: null },
      })
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse analysis', raw: textBlock.text },
        { status: 502 }
      )
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `API error: ${msg}` },
      { status: 502 }
    )
  }
}
