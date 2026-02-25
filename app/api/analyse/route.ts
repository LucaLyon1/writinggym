import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { ExtractAnalysis } from '@/types/extract'
import type { Json } from '@/types/database.types'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { constraintKey } from '@/lib/constraint-key'
import { createClient } from '@/lib/supabase/server'
import { checkAnalysisQuota, recordAnalysisRequest } from '@/lib/plan'

const SYSTEM_PROMPT = `You are a literary craft analyst helping writers learn by imitation. 
Given a literary extract and an imitation constraint, you will:
1. Split the extract into meaningful segments (roughly clause or sentence level)
2. Annotate the most interesting segments with a craft category and a plain-English note
3. Write a 3-sentence summary of what makes this extract worth imitating
4. Return valid JSON only — no markdown, no preamble

Craft categories:
- "structure": how sentences are built — length, syntax, clause order, rhythm
- "voice": personality bleeding through word choice, tone, register, point of view
- "imagery": concrete sensory detail that makes abstract things visible or felt
- "pacing": the speed of information — compression, expansion, what is skipped

Rules:
- Annotate 3–5 segments maximum. Not every segment needs an annotation.
- Notes should be 1–3 sentences. Plain English. No jargon. Explain the effect on the reader, not just the technique.
- Segments must together reconstruct the original text exactly when concatenated.
- The "constraint" field in your response should rephrase the user's constraint as a direct, actionable writing prompt in second person.

Response shape (JSON only):
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

  // ── 3. Weekly quota check ───────────────────────────────────
  const quota = await checkAnalysisQuota(user.id)

  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: `You've used ${quota.used}/${quota.limit} analyses this week. Upgrade to Core for unlimited access.`,
        quota: { used: quota.used, limit: quota.limit },
        upgradeUrl: '/pricing',
      },
      { status: 429 }
    )
  }

  // ── 4. Call Claude ────────────────────────────────────────────
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

    // ── 5. Save to cache + record usage ──────────────────────────
    await Promise.all([
      supabaseAdmin.from('passage_analyses').insert({
        passage_id: body.extractId,
        constraint_key: key,
        analysis: analysis as unknown as Json,
      }),
      recordAnalysisRequest(user.id, body.extractId, key),
    ])

    return NextResponse.json(analysis)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `Anthropic API error: ${message}` },
      { status: 502 }
    )
  }
}