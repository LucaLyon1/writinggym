import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are a literary style analyst. You will receive a short writing sample (1-2 paragraphs) from a user.

Your job: identify which well-known author the user's writing style most resembles, and explain why.

Analyze these dimensions of the writing:
- Sentence structure and rhythm
- Diction and vocabulary choices
- Use of imagery and figurative language
- Tone and narrative voice
- Pacing and paragraph construction

Return valid JSON only (no markdown, no preamble) in this exact format:

{
  "author": "Author Name",
  "confidence": 0-100 (integer percentage of how closely the writing matches this author's style),
  "traits": [
    "Short description of a stylistic trait they share (1 sentence)",
    "Another shared trait (1 sentence)",
    "A third shared trait (1 sentence)"
  ],
  "excerpt_highlight": "A short quote from the user's text that most strongly evokes the matched author",
  "suggestion": "One concrete, encouraging suggestion for the writer to develop their voice further (1-2 sentences)"
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

  const body = (await request.json()) as {
    text: string
    prompt: string
  }

  if (!body.text || !body.prompt) {
    return NextResponse.json(
      { error: 'Missing required fields: text, prompt' },
      { status: 400 }
    )
  }

  if (body.text.trim().split(/\s+/).length < 30) {
    return NextResponse.json(
      { error: 'Please write at least 30 words so we can analyze your style.' },
      { status: 400 }
    )
  }

  const client = new Anthropic({ apiKey })

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `The writer was responding to this prompt: "${body.prompt}"\n\nHere is their writing:\n\n${body.text}`,
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
      const analysis = JSON.parse(cleaned)
      return NextResponse.json(analysis)
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
