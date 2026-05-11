import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { constraintKey } from '@/lib/constraint-key'
import type { Json } from '@/types/database.types'
import { recordSessionCompletion, checkDailySessionQuota } from '@/lib/plan'
import { getPostHogClient } from '@/lib/posthog-server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'You must be signed in to view your submissions.' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const passageId = searchParams.get('passageId')
  const constraint = searchParams.get('constraint')

  if (!passageId || !constraint) {
    return NextResponse.json(
      { error: 'Missing passageId or constraint' },
      { status: 400 }
    )
  }

  const key = constraintKey(constraint)

  const { data, error } = await supabase
    .from('passage_completions')
    .select('*')
    .eq('user_id', user.id)
    .eq('passage_id', passageId)
    .eq('constraint_key', key)
    .order('completed_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: error.message ?? 'Failed to fetch submissions' },
      { status: 500 }
    )
  }

  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'You must be signed in to save your progress.' },
      { status: 401 }
    )
  }

  const body = (await request.json()) as {
    passageId: string
    constraint: string
    userText: string
    wordCount?: number
    feedback?: { segments: unknown[]; summary: string[]; feedback: string } | null
  }

  if (!body.passageId || !body.constraint) {
    return NextResponse.json(
      { error: 'Missing required fields: passageId, constraint' },
      { status: 400 }
    )
  }

  const trimmed = typeof body.userText === 'string' ? body.userText.trim() : ''
  if (trimmed.length === 0) {
    return NextResponse.json(
      { error: 'Add some text before submitting.' },
      { status: 400 }
    )
  }

  const sessionQuota = await checkDailySessionQuota(user.id)
  if (!sessionQuota.allowed) {
    return NextResponse.json(
      {
        error: 'You\'ve reached your daily session limit. Upgrade to Core for unlimited sessions.',
        upgradeUrl: '/pricing',
        requiresUpgrade: true,
      },
      { status: 403 }
    )
  }

  const key = constraintKey(body.constraint)
  const wordCount =
    body.wordCount ??
    (trimmed === '' ? 0 : trimmed.split(/\s+/).length)

  const feedbackPayload: Json | null = body.feedback
    ? (body.feedback as unknown as Json)
    : null

  const { data: inserted, error } = await supabase
    .from('passage_completions')
    .insert({
      passage_id: body.passageId,
      constraint_key: key,
      user_id: user.id,
      user_text: trimmed,
      word_count: wordCount,
      feedback: feedbackPayload,
      completed_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message ?? 'Failed to save completion' },
      { status: 500 }
    )
  }

  // Update streaks, daily stats, and profile counters
  await recordSessionCompletion(user.id, body.passageId, wordCount).catch(
    (err) => console.error('Failed to record session completion:', err)
  )

  const posthog = getPostHogClient()
  posthog.capture({
    distinctId: user.id,
    event: 'writing_submitted',
    properties: {
      passage_id: body.passageId,
      word_count: wordCount,
      completion_id: inserted.id,
    },
  })
  await posthog.shutdown()

  return NextResponse.json({ id: inserted.id, success: true })
}
