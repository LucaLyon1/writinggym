import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { ExtractAnalysis } from '@/types/extract'
import { createClient } from '@/lib/supabase/server'
import { constraintKey } from '@/lib/constraint-key'
import { checkAnalysisQuota, recordAnalysisRequest } from '@/lib/plan'

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

2. Score the writing on 5 criteria, each out of 100.

Fairness and trade-off policy (important):
- Do not double-punish the writer for the same trade-off.
- If the writer follows a difficult constraint well but quality drops, reflect that mainly in craft scores, not in constraint score.
- If the writer improves quality by drifting from the constraint, reflect that mainly in constraint score, not by also crushing craft scores unless the craft itself is weak.
- Reward intelligent risk-taking and ambition, even when execution is uneven.
- Keep scores differentiated: avoid giving all five criteria nearly the same score.

Calibration anchors:
- A score of 70 means competent and clear execution.
- A score of 85 means strong, deliberate craft choices.
- A score of 90+ means exceptional work that feels publishable or unmistakably authorial.
- Reserve below 25 for text that barely attempts the task.

Criterion definitions (use these exactly):
- "voice": Voice — Does the writer develop a distinctive, committed tone? Word choice, register, consistency. A score of 70 means competent and clear. 85 means the voice feels like a real stylistic choice. 90+ means you'd recognize it in another piece.
- "imagery": Imagery — Quality and specificity of sensory detail. Does the writing make you see? 70 means solid, accurate detail. 85 means at least one image that surprises. 90+ means a detail that couldn't have come from anyone else.
- "structure": Structure — Sentence construction, rhythm, variety. Does the prose have shape and intention? 70 means controlled. 85 means the rhythm serves the meaning. 90+ means the form and content feel inseparable.
- "pacing": Pacing — Speed of information delivery. Is compression and expansion deliberate? 70 means nothing drags or rushes. 85 means the pacing creates emphasis. 90+ means you feel the writer accelerating and braking with purpose.
- "constraint": Constraint — How faithfully and intelligently does the writing honor the exercise? 70 means the constraint is followed technically. 85 means it's followed in spirit, with understanding of why it exists. 90+ means the constraint becomes invisible — the writing feels free while obeying every rule.

3. Write honest, constructive feedback (2–4 paragraphs) that:
   - Names what's working well — be specific, cite phrases or moments
   - Identifies what's not working or could be stronger — again, be specific
   - Compares meaningfully to the original: where does the user capture the spirit? Where do they miss?
   - Suggests 1–2 concrete next steps to improve
   - Be direct and kind. No false praise. Writers learn from honest critique.

4. Write a single punchy verdict sentence (max 12 words) that captures the overall impression — like a headline review.

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
  "feedback": "Your honest 2–4 paragraph critique here. Be specific. Be constructive.",
  "scores": {
    "voice": 55,
    "imagery": 62,
    "structure": 48,
    "pacing": 50,
    "constraint": 70
  },
  "verdict": "A solid first attempt with flashes of real voice."
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
  voice: number
  imagery: number
  structure: number
  pacing: number
  constraint: number
}

export interface UserFeedback {
  segments: ExtractAnalysis['segments']
  summary: string[]
  feedback: string
  scores: FeedbackScores
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

  // ── Quota check (feedback counts toward analysis quota) ───────
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
