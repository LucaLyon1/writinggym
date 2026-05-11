import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { ExtractAnalysis } from '@/types/extract'
import type { Json } from '@/types/database.types'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { constraintKey } from '@/lib/constraint-key'
import {
  checkAnalysisQuota,
  recordAnalysisRequest,
  recordSessionCompletion,
  isPaidUser,
} from '@/lib/plan'
import { getPostHogClient } from '@/lib/posthog-server'

const SYSTEM_PROMPT = `You are a literary craft analyst giving honest, constructive feedback to a writer attempting a stylistic exercise.

You will receive:

The ORIGINAL extract (a published literary passage)

The CONSTRAINT (the writing prompt the user was given)

The USER'S WRITING (their response)

Your only goal is to help this writer improve. Not to grade them, not to rank them — to show them concretely what they're doing well, what they could work on, and how to get better.

Focus strictly on how the text is written, not on theme, symbolism, or literary interpretation.

You will:

Split the user's writing into meaningful segments

Annotate the most instructive segments with craft observations

Identify the strongest elements of their writing

Identify the weakest elements — the things that would most improve their prose if addressed

Provide a textual analysis that helps them understand what's working and what isn't

Provide dimension-by-dimension divergence analysis comparing the user's instincts to the original

Deliver one specific, actionable next step tied to this exact passage

Return valid JSON only (no markdown, no preamble)

SEGMENTATION RULES

Segments must preserve every character of the user's text, including spaces and punctuation.

Concatenating all "segments.text" values must reproduce the user's writing exactly.

Do not paraphrase or modify the text.

Segments should usually correspond to a full sentence or a clear clause boundary (comma, semicolon, dash).

Avoid fragmenting text unless the craft effect depends on it.

ANNOTATION RULES

Annotate 3–5 segments maximum.

Only annotate segments where a craft decision is noticeable or instructive.

Notes must be 1–3 sentences in plain English.

Avoid literary jargon.

Explain the effect on the reader or the rhythm of the passage, not just the technique.

CRAFT CATEGORIES

"structure": sentence architecture — length, clause layering, contrast, rhetorical movement, rhythm

"voice": personality expressed through diction, tone, attitude, or point of view

"imagery": concrete sensory detail that makes something visible, audible, physical, or felt

"pacing": control of narrative speed — compression, expansion, delay, emphasis

PRIMARY EVALUATION RULE

The CONSTRAINT defines the main learning objective of the exercise.

Evaluate how the writer handled craft elements in the service of the constraint, not as independent stylistic goals.

STRONG POINTS

Identify 2–4 things the writer does well in this piece. Be specific — cite actual phrases or decisions. These should be genuinely strong, not consolation prizes. If something is mediocre, don't call it a strong point.

WEAK POINTS

Identify 2–4 things the writer should work on. Be honest and specific. Each weak point should name the problem and briefly explain why it matters for the reader. These are not insults — they are the most efficient path to improvement.

ANALYSIS

Write 2–4 paragraphs of constructive critique.

Your analysis must clearly address two questions:

Did the writer successfully execute the constraint?

How strong is the prose beyond the constraint?

Also:

Cite specific phrases or moments

Compare meaningfully to the original passage

Be honest and precise. Avoid vague praise.

DIVERGENCE ANALYSIS

For each craft dimension that is relevant to this exercise, write a short analysis (2–3 sentences) that:
1. Names what the original passage does in this dimension
2. Describes how the user's instincts diverged from (or matched) the original
3. Explains why that divergence matters — what effect it changes for the reader

For dimensions not relevant to this exercise, return null.

Every sentence must reference a specific choice the user made and a specific choice the original author made. Generic observations are worthless.

NEXT STEP

Write exactly one concrete, specific thing the writer could try on their next attempt. Not generic advice — something tied to this passage and this attempt.

VERDICT

Write a single punchy sentence (max 12 words) summarizing the overall impression.

RESPONSE FORMAT (valid JSON only):

{
"segments": [
{ "text": "...", "annotation": { "category": "voice", "note": "..." } },
{ "text": " " },
{ "text": "...", "annotation": { "category": "structure", "note": "..." } }
],
"strong_points": ["Specific strong point 1", "Specific strong point 2"],
"weak_points": ["Specific weak point 1", "Specific weak point 2"],
"analysis": "2–4 paragraph critique here.",
"divergences": {
"voice": "2–3 sentence analysis or null",
"imagery": null,
"structure": "2–3 sentence analysis or null",
"pacing": null
},
"next_step": "One specific, concrete thing to try next time.",
"verdict": "Short headline-style verdict."
}`

function stripMarkdownFences(raw: string): string {
  let cleaned = raw.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '')
    cleaned = cleaned.replace(/\n?```\s*$/, '')
  }
  return cleaned.trim()
}

export interface DivergenceAnalysis {
  voice: string | null
  imagery: string | null
  structure: string | null
  pacing: string | null
}

export interface UserFeedback {
  segments: ExtractAnalysis['segments']
  strong_points: string[]
  weak_points: string[]
  analysis: string
  divergences?: DivergenceAnalysis
  next_step: string
  verdict: string
}

async function hasUsedLifetimeFreeAnalysis(userId: string): Promise<boolean> {
  const { count } = await supabaseAdmin
    .from('analysis_requests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  return (count ?? 0) > 0
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not set. Add it to your .env file.' },
      { status: 500 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Sign in to use feedback.' },
      { status: 401 }
    )
  }

  const paid = await isPaidUser(user.id)

  // Free users get one lifetime "aha" analysis before the paywall.
  let isFreePreview = false
  if (!paid) {
    const alreadyUsed = await hasUsedLifetimeFreeAnalysis(user.id)
    if (alreadyUsed) {
      const posthogPaywall = getPostHogClient()
      posthogPaywall.capture({ distinctId: user.id, event: 'free_analysis_paywall_hit', properties: {} })
      await posthogPaywall.shutdown()
      return NextResponse.json(
        {
          error:
            'You\'ve used your free analysis. Upgrade to Core for unlimited detailed feedback on every rewrite.',
          upgradeUrl: '/pricing',
          requiresUpgrade: true,
        },
        { status: 403 }
      )
    }
    isFreePreview = true
  }

  if (paid) {
    const quota = await checkAnalysisQuota(user.id)
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `You've used ${quota.used}/${quota.limit} analyses this week. Contact support if you need more.`,
          quota: { used: quota.used, limit: quota.limit },
        },
        { status: 429 }
      )
    }
  }

  const body = (await request.json()) as {
    userText: string
    originalText: string
    constraint: string
    passageId?: string
    completionId?: string
  }

  if (!body.userText || !body.originalText || !body.constraint) {
    return NextResponse.json(
      { error: 'Missing required fields: userText, originalText, constraint' },
      { status: 400 }
    )
  }

  if (body.passageId && !body.completionId) {
    return NextResponse.json(
      { error: 'Submit your writing before requesting analysis.' },
      { status: 400 }
    )
  }

  if (body.passageId && body.completionId) {
    const compKey = constraintKey(body.constraint)
    const { data: row, error: rowError } = await supabase
      .from('passage_completions')
      .select('id, passage_id, constraint_key, user_text')
      .eq('id', body.completionId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (rowError || !row) {
      return NextResponse.json(
        { error: 'Submission not found, or you no longer have access to it. Submit your writing again.' },
        { status: 400 }
      )
    }

    if (row.passage_id !== body.passageId || row.constraint_key !== compKey) {
      return NextResponse.json(
        { error: 'This submission does not match this extract.' },
        { status: 400 }
      )
    }

    if (row.user_text?.trim() !== body.userText.trim()) {
      return NextResponse.json(
        { error: 'Your text changed since the last save. Submit again before analysing.' },
        { status: 400 }
      )
    }
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

    // Record the analysis request (counts toward quota and the free-lifetime gate).
    if (body.passageId) {
      await recordAnalysisRequest(
        user.id,
        body.passageId,
        constraintKey(body.constraint)
      )
    }

    if (body.passageId && body.completionId) {
      const trimmed = body.userText.trim()
      const wordCount = trimmed === '' ? 0 : trimmed.split(/\s+/).length
      const { error: updateError } = await supabase
        .from('passage_completions')
        .update({
          feedback: result as unknown as Json,
          user_text: trimmed,
          word_count: wordCount,
        })
        .eq('id', body.completionId)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Failed to update completion with feedback:', updateError)
        return NextResponse.json(
          { error: 'Failed to save your feedback. Try again in a moment.' },
          { status: 500 }
        )
      }
    }

    const posthog = getPostHogClient()
    posthog.capture({
      distinctId: user.id,
      event: 'writing_analyzed',
      properties: {
        passage_id: body.passageId ?? null,
        completion_id: body.completionId ?? null,
        free_preview: isFreePreview,
        word_count: body.userText.trim().split(/\s+/).length,
      },
    })
    await posthog.shutdown()

    return NextResponse.json({ ...result, freePreview: isFreePreview })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `Anthropic API error: ${message}` },
      { status: 502 }
    )
  }
}
