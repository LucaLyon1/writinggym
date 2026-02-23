import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { ExtractAnalysis } from '@/types/extract'

const SYSTEM_PROMPT = `You are a literary craft analyst giving honest, constructive feedback to a writer who has attempted an imitation exercise.

You will receive:
1. The ORIGINAL extract (a published literary passage)
2. The CONSTRAINT (the writing prompt the user was given)
3. The USER'S WRITING (what they wrote in response)

Your task:
1. Analyze the user's writing using the SAME structure as extract analysis:
   - Split into meaningful segments (clause or sentence level)
   - Annotate 3–5 interesting segments with craft categories: structure, voice, imagery, pacing
   - Notes should explain what the writer is doing and its effect

2. Write honest, constructive feedback (2–4 paragraphs) that:
   - Names what's working well — be specific, cite phrases or moments
   - Identifies what's not working or could be stronger — again, be specific
   - Compares meaningfully to the original: where does the user capture the spirit? Where do they miss?
   - Suggests 1–2 concrete next steps to improve
   - Be direct and kind. No false praise. Writers learn from honest critique.

Craft categories (same as extract analysis):
- "structure": sentence length, syntax, clause order, rhythm
- "voice": word choice, tone, register, point of view
- "imagery": concrete sensory detail
- "pacing": speed of information, compression, expansion

Response shape (valid JSON only, no markdown fences):
{
  "segments": [
    { "text": "...", "annotation": { "category": "voice", "note": "..." } },
    { "text": " " },
    { "text": "..." }
  ],
  "summary": ["sentence 1", "sentence 2"],
  "feedback": "Your honest 2–4 paragraph critique here. Be specific. Be constructive."
}`

function stripMarkdownFences(raw: string): string {
  let cleaned = raw.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '')
    cleaned = cleaned.replace(/\n?```\s*$/, '')
  }
  return cleaned.trim()
}

export interface UserFeedback {
  segments: ExtractAnalysis['segments']
  summary: string[]
  feedback: string
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not set. Add it to your .env file.' },
      { status: 500 }
    )
  }

  const body = (await request.json()) as {
    userText: string
    originalText: string
    constraint: string
  }

  if (!body.userText || !body.originalText || !body.constraint) {
    return NextResponse.json(
      { error: 'Missing required fields: userText, originalText, constraint' },
      { status: 400 }
    )
  }

  if (body.userText.trim().length < 50) {
    return NextResponse.json(
      { error: 'Write at least 50 characters before requesting feedback.' },
      { status: 400 }
    )
  }

  const client = new Anthropic({ apiKey })

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Original extract:\n\n${body.originalText}\n\nConstraint: ${body.constraint}\n\nUser's writing:\n\n${body.userText}`,
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

    let result: UserFeedback
    try {
      result = JSON.parse(cleaned) as UserFeedback
    } catch {
      return NextResponse.json(
        {
          error: 'Failed to parse Claude response as JSON',
          raw: textBlock.text,
        },
        { status: 502 }
      )
    }

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `Anthropic API error: ${message}` },
      { status: 502 }
    )
  }
}
