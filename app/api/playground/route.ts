import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { constraintKey } from '@/lib/constraint-key'
import { PLAYGROUND_PASSAGE_PREFIX } from '@/lib/playground-passage'
import type { Json } from '@/types/database.types'

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
    passageId?: string
    completionId?: string
  }

  if (!body.text || !body.prompt) {
    return NextResponse.json(
      { error: 'Missing required fields: text, prompt' },
      { status: 400 }
    )
  }

  if (
    !body.passageId?.startsWith(PLAYGROUND_PASSAGE_PREFIX) ||
    !body.completionId
  ) {
    return NextResponse.json(
      { error: 'Submit your writing before requesting analysis.' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Sign in to analyze your writing.' },
      { status: 401 }
    )
  }

  const compKey = constraintKey(body.prompt)
  const { data: row, error: rowError } = await supabase
    .from('passage_completions')
    .select('id, passage_id, constraint_key, user_text')
    .eq('id', body.completionId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (rowError || !row) {
    return NextResponse.json(
      {
        error:
          'Submission not found, or you no longer have access to it. Submit your writing again.',
      },
      { status: 400 }
    )
  }

  if (row.passage_id !== body.passageId || row.constraint_key !== compKey) {
    return NextResponse.json(
      { error: 'This submission does not match this exercise.' },
      { status: 400 }
    )
  }

  if (row.user_text?.trim() !== body.text.trim()) {
    return NextResponse.json(
      {
        error:
          'Your text changed since the last save. Submit again before analysing.',
      },
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
      const analysis = JSON.parse(cleaned) as Record<string, unknown>
      const trimmed = body.text.trim()
      const wordCount = trimmed === '' ? 0 : trimmed.split(/\s+/).length
      const { error: updateError } = await supabase
        .from('passage_completions')
        .update({
          feedback: analysis as unknown as Json,
          user_text: trimmed,
          word_count: wordCount,
        })
        .eq('id', body.completionId)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Failed to save playground analysis:', updateError)
        return NextResponse.json(
          { error: 'Failed to save your analysis. Try again in a moment.' },
          { status: 500 }
        )
      }

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
