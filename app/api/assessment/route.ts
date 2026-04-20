import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const VALID_CATEGORIES = [
  'character-intro',
  'in-medias-res',
  'place-and-atmosphere',
  'dialogue',
  'interiority',
  'time-and-memory',
  'rhythm-and-style',
  'tension-and-dread',
  'poetry',
] as const

type CategoryId = (typeof VALID_CATEGORIES)[number]

const SYSTEM_PROMPT = `You are a literary craft analyst giving an honest first read of a short writing sample from a user.

There is no prompt or exercise — they wrote freely. Your job is to show them their natural strengths, their growth areas, and recommend ONE craft dimension they should practice first.

STRONG POINTS
Identify 2–3 things the writer does well. Be specific — cite actual phrases. If something is mediocre, do not call it a strong point.

WEAK POINTS
Identify 2–3 things the writer should work on. Be honest, specific, and name the problem clearly. These should be the most efficient levers for improvement.

NEXT STEP
One concrete thing to try next. Tied to this piece, not generic advice.

VERDICT
One punchy sentence (max 14 words) summarizing the writer's voice.

RECOMMENDED CATEGORY
Pick exactly ONE category from this list that would most help this writer grow right now, based on their weakest dimension or the skill they most seem to be reaching for:

- character-intro  (bringing a person into existence on the page)
- in-medias-res  (openings that drop the reader into motion)
- place-and-atmosphere  (setting that is as alive as character)
- dialogue  (what people say and what they mean)
- interiority  (the texture of thought and feeling from inside)
- time-and-memory  (the past pressing into the present)
- rhythm-and-style  (sentence music, the "how" as much as the "what")
- tension-and-dread  (withholding, implication, unease)
- poetry  (compression, image, line-by-line attention)

Return the category ID exactly (lowercase, hyphenated) in the "recommended_category" field.

REASON
One short sentence (max 22 words) explaining WHY this category fits this writer right now. Must reference something concrete in their writing.

Return valid JSON only (no markdown, no preamble):

{
  "strong_points": ["...", "..."],
  "weak_points": ["...", "..."],
  "next_step": "...",
  "verdict": "...",
  "recommended_category": "dialogue",
  "reason": "..."
}`

function stripMarkdownFences(raw: string): string {
  let cleaned = raw.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '')
    cleaned = cleaned.replace(/\n?```\s*$/, '')
  }
  return cleaned.trim()
}

export interface AssessmentResult {
  strong_points: string[]
  weak_points: string[]
  next_step: string
  verdict: string
  recommended_category: CategoryId
  reason: string
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
    return NextResponse.json({ error: 'Missing text.' }, { status: 400 })
  }

  const wordCount = body.text.trim().split(/\s+/).length
  if (wordCount < 30) {
    return NextResponse.json(
      { error: 'Write at least 30 words so we can assess your voice.' },
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

    let parsed: AssessmentResult
    try {
      parsed = JSON.parse(cleaned) as AssessmentResult
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse assessment', raw: textBlock.text },
        { status: 502 }
      )
    }

    if (!VALID_CATEGORIES.includes(parsed.recommended_category)) {
      parsed.recommended_category = 'rhythm-and-style'
    }

    return NextResponse.json(parsed)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `API error: ${msg}` }, { status: 502 })
  }
}
