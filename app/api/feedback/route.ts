import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { ExtractAnalysis } from '@/types/extract'
import { createClient } from '@/lib/supabase/server'
import { constraintKey } from '@/lib/constraint-key'
import { checkAnalysisQuota, recordAnalysisRequest, isPaidUser } from '@/lib/plan'

const SYSTEM_PROMPT = `You are a literary craft analyst giving honest, constructive feedback to a writer attempting a stylistic exercise.

You will receive:

The ORIGINAL extract (a published literary passage)

The CONSTRAINT (the writing prompt the user was given)

The USER'S WRITING (their response)

Your job is to evaluate how the writer executed the exercise and how effectively their prose works on a craft level.

Focus strictly on how the text is written, not on theme, symbolism, or literary interpretation.

You will:

Split the user's writing into meaningful segments

Annotate the most instructive segments with craft observations

Score the writing on five criteria

Provide dimension-by-dimension divergence analysis comparing the user's instincts to the original

Deliver one specific, actionable observation tied to this exact passage

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

When scoring craft categories, evaluate how the writer handled those elements in the service of the constraint, not as independent stylistic goals.

RELEVANCE FILTER

Before scoring, decide which of the four craft categories (voice, imagery, structure, pacing) are "in play" for this exercise.

A category is IN PLAY if the original passage demonstrates clear strength or intentional control in that area, OR if the constraint explicitly asks the writer to work on it.

A category is NOT IN PLAY if the original passage intentionally suppresses, de-emphasises, or is indifferent to that dimension AND the constraint does not ask the writer to address it.

For categories that are NOT in play, return null instead of a numeric score. Do not penalise the writer for qualities the exercise never asked them to produce.

The "constraint" score is always in play.

SCORING

Score each in-play criterion from 0–100. Return null for criteria that are not in play.

Calibration anchors:

60 = understandable attempt

70 = competent execution

85 = strong, deliberate craft control

90+ = exceptional and unmistakably authorial

Below 25 = barely attempts the task

Be honest. A first attempt should rarely score above 70 on any dimension. A score of 85+ means the writer demonstrated something genuinely authorial. Do not flatter.

CRITERION DEFINITIONS

"voice": Does the writer establish a tonal personality through diction and attitude?

"imagery": Quality and specificity of sensory detail.

"structure": Sentence construction and rhythm.

"pacing": Control of narrative speed and emphasis.

"constraint": How faithfully and intelligently the writer executed the exercise.

CONSTRAINT SCORING

The constraint score should primarily reflect:

Did the writer clearly attempt the exercise?

Did they understand the intention behind it?

Does the result demonstrate the craft lesson the exercise is meant to teach?

DIVERGENCE ANALYSIS

For each in-play craft dimension, write a short analysis (2–3 sentences) that:
1. Names what the original passage does in this dimension
2. Describes how the user's instincts diverged from (or matched) the original
3. Explains why that divergence matters — what effect it changes for the reader

For dimensions that are not in play, return null.

This is the most important part of the feedback. Generic observations are worthless. Every sentence must reference a specific choice the user made and a specific choice the original author made. "Your sentences are shorter" is not enough — "Your sentences average 8 words where McCarthy uses 40-word sentences joined by 'and'; the original creates a breathless accumulation, while yours creates staccato bursts that work against the sense of relentless movement" is what we need.

ACTIONABLE OBSERVATION

Write exactly one concrete, specific thing the writer could try on their next attempt. Not generic advice like "vary your sentence length" — something tied to this passage and this attempt. Example: "Try rewriting your second sentence as a single clause that mirrors McCarthy's use of polysyndeton — chain three concrete images with 'and' instead of separating them with periods."

FEEDBACK

Write 2–4 paragraphs of constructive critique.

Your feedback must clearly address two questions:

Did the writer successfully execute the constraint?

How strong is the prose beyond the constraint?

Also:

Cite specific phrases or moments

Compare meaningfully to the original passage

Be honest and precise. Avoid vague praise.

VERDICT

Write a single punchy sentence (max 12 words) summarizing the overall impression.

RESPONSE FORMAT (valid JSON only):

{
"segments": [
{ "text": "...", "annotation": { "category": "voice", "note": "..." } },
{ "text": " " },
{ "text": "...", "annotation": { "category": "structure", "note": "..." } }
],
"feedback": "2–4 paragraph critique here.",
"scores": {
"voice": 55,
"imagery": null,
"structure": 48,
"pacing": null,
"constraint": 70
},
"divergences": {
"voice": "2–3 sentence analysis of how the user's voice diverged from the original, or null if not in play.",
"imagery": null,
"structure": "2–3 sentence analysis...",
"pacing": null
},
"actionable_observation": "One specific, concrete thing to try next time, tied to this exact passage and attempt.",
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

export interface FeedbackScores {
  voice: number | null
  imagery: number | null
  structure: number | null
  pacing: number | null
  constraint: number
}

export interface DivergenceAnalysis {
  voice: string | null
  imagery: string | null
  structure: string | null
  pacing: string | null
}

export interface UserFeedback {
  segments: ExtractAnalysis['segments']
  summary: string[]
  feedback: string
  scores: FeedbackScores
  divergences: DivergenceAnalysis
  actionable_observation: string
  verdict: string
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not set. Add it to your .env file.' },
      { status: 500 }
    )
  }

  // ── Auth check ────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Sign in to use feedback.' },
      { status: 401 }
    )
  }

  // ── Paid plan check — AI analysis is a paid feature ──────────
  const paid = await isPaidUser(user.id)
  if (!paid) {
    return NextResponse.json(
      {
        error: 'AI analysis is available on the Core plan. Upgrade to get detailed feedback, scores, and craft coaching on every rewrite.',
        upgradeUrl: '/pricing',
        requiresUpgrade: true,
      },
      { status: 403 }
    )
  }

  // ── Quota check (safety limit for paid users) ─────────────
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

  const body = (await request.json()) as {
    userText: string
    originalText: string
    constraint: string
    passageId?: string
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

    if (body.passageId) {
      await recordAnalysisRequest(user.id, body.passageId, constraintKey(body.constraint))
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
