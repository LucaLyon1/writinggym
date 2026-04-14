import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { ExtractAnalysis } from '@/types/extract'
import type { Json } from '@/types/database.types'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { constraintKey } from '@/lib/constraint-key'
import { createClient } from '@/lib/supabase/server'

const SYSTEM_PROMPT = `You are a literary craft analyst helping writers learn by imitation.

Your job is to analyze a short passage from a master writer and reveal the concrete craft decisions that make it effective. Focus strictly on how the text is written, not on theme, symbolism, or literary interpretation.

You will:

Split the passage into meaningful segments

Annotate only the most instructive segments with a craft category and explanation

Extract three concrete craft lessons

Turn the user's constraint into a clear imitation exercise

Return valid JSON only (no markdown, no preamble)

SEGMENTATION RULES

Segments must preserve every character of the original text, including spaces and punctuation.

The concatenation of all "segments.text" values must reproduce the source passage exactly.

Do not paraphrase, normalize, or edit the text.

Segments should usually correspond to a full sentence or a clear clause boundary (comma, semicolon, dash).

Keep segments reasonably large; avoid fragmenting unless the craft effect depends on it.

ANNOTATION RULES

Only annotate segments where the craft decision is clearly intentional or instructive.

Many segments should remain unannotated.

Notes must be 1–3 sentences.

Write in plain English with no literary jargon.

Explain the effect on the reader or the rhythm of the passage, not just the technique.

Focus strictly on writing craft. Do not analyze plot, theme, or symbolism.

CRAFT CATEGORIES

"structure": sentence architecture — length, clause layering, contrast, reversal, rhetorical movement, or rhythm

"voice": personality expressed through diction, tone, attitude, or point of view

"imagery": concrete sensory detail that makes something visible, audible, physical, or felt

"pacing": control of narrative speed — compression, expansion, delay, or emphasis

SUMMARY RULES
Write three short sentences describing the main craft lessons a writer could learn from this passage. Focus on transferable writing techniques.

CONSTRAINT RULE
Rewrite the user's constraint as a single clear writing exercise in second person. The instruction should push the writer to reproduce one key craft feature from the passage.

RESPONSE FORMAT
Return valid JSON only.

{
"segments": [
{ "text": "...", "annotation": { "category": "voice", "note": "..." } },
{ "text": " " },
{ "text": "...", "annotation": { "category": "structure", "note": "..." } }
],
"summary": ["sentence 1", "sentence 2", "sentence 3"],
"constraint": "...",
"source": "..."
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
      { error: 'ANTHROPIC_API_KEY is not set. Add it to your .env file.' },
      { status: 500 }
    )
  }

  const body = (await request.json()) as {
    extractId: string
    text: string
    constraint: string
  }

  if (!body.text || !body.constraint || !body.extractId) {
    return NextResponse.json(
      { error: 'Missing required fields: extractId, text, constraint' },
      { status: 400 }
    )
  }

  const key = constraintKey(body.constraint)

  // ── 1. Cache check — return early if analysis already exists ──
  const { data: existing } = await supabaseAdmin
    .from('passage_analyses')
    .select('analysis')
    .eq('passage_id', body.extractId)
    .eq('constraint_key', key)
    .maybeSingle()

  if (existing?.analysis) {
    return NextResponse.json(existing.analysis as unknown as ExtractAnalysis)
  }

  // ── 2. Auth check — required before calling Claude ────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Sign in to use analysis.' },
      { status: 401 }
    )
  }

  // ── 3. Call Claude ─────────────────────────────────────────
  const client = new Anthropic({ apiKey })

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Extract:\n\n${body.text}\n\nConstraint: ${body.constraint}`,
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

    let analysis: ExtractAnalysis
    try {
      analysis = JSON.parse(cleaned) as ExtractAnalysis
    } catch {
      return NextResponse.json(
        {
          error: 'Failed to parse Claude response as JSON',
          raw: textBlock.text,
        },
        { status: 502 }
      )
    }

    // ── 4. Save to cache ──────────────────────────────────────────
    await supabaseAdmin.from('passage_analyses').insert({
      passage_id: body.extractId,
      constraint_key: key,
      analysis: analysis as unknown as Json,
    })

    return NextResponse.json(analysis)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `Anthropic API error: ${message}` },
      { status: 502 }
    )
  }
}