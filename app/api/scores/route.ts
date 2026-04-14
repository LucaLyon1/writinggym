import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { passages } from '@/data/passages'

interface FeedbackScores {
  voice: number | null
  imagery: number | null
  structure: number | null
  pacing: number | null
  constraint: number
}

interface CompletionRow {
  id: string
  passage_id: string
  completed_at: string
  feedback: { scores?: FeedbackScores } | null
}

export interface ScoreSnapshot {
  date: string
  passage_id: string
  passage_title: string
  author: string
  voice: number | null
  imagery: number | null
  structure: number | null
  pacing: number | null
  constraint: number | null
}

export interface ScoreAverages {
  voice: number | null
  imagery: number | null
  structure: number | null
  pacing: number | null
  constraint: number | null
  overall: number | null
  session_count: number
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Sign in to view your scores.' },
      { status: 401 }
    )
  }

  const { data, error } = await supabase
    .from('passage_completions')
    .select('id, passage_id, completed_at, feedback')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const passageMap = new Map(passages.map((p) => [p.id, p]))

  const history: ScoreSnapshot[] = []
  const sums = { voice: 0, imagery: 0, structure: 0, pacing: 0, constraint: 0 }
  const counts = { voice: 0, imagery: 0, structure: 0, pacing: 0, constraint: 0 }

  for (const row of (data ?? []) as CompletionRow[]) {
    const scores = row.feedback?.scores
    if (!scores) continue

    const passage = passageMap.get(row.passage_id)

    history.push({
      date: row.completed_at,
      passage_id: row.passage_id,
      passage_title: passage?.title ?? row.passage_id,
      author: passage?.author ?? 'Unknown',
      voice: scores.voice,
      imagery: scores.imagery,
      structure: scores.structure,
      pacing: scores.pacing,
      constraint: scores.constraint,
    })

    for (const dim of ['voice', 'imagery', 'structure', 'pacing', 'constraint'] as const) {
      if (scores[dim] !== null && scores[dim] !== undefined) {
        sums[dim] += scores[dim]!
        counts[dim]++
      }
    }
  }

  const avg = (dim: keyof typeof sums) =>
    counts[dim] > 0 ? Math.round(sums[dim] / counts[dim]) : null

  const averages: ScoreAverages = {
    voice: avg('voice'),
    imagery: avg('imagery'),
    structure: avg('structure'),
    pacing: avg('pacing'),
    constraint: avg('constraint'),
    overall: null,
    session_count: history.length,
  }

  const allAvgs = [averages.voice, averages.imagery, averages.structure, averages.pacing, averages.constraint]
    .filter((v): v is number => v !== null)
  averages.overall = allAvgs.length > 0 ? Math.round(allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length) : null

  // Authors encountered
  const authorSet = new Set<string>()
  for (const snap of history) {
    if (snap.author !== 'Unknown') authorSet.add(snap.author)
  }

  // Dimensions practiced (count of sessions where each dimension was in play)
  const dimensionsPracticed = {
    voice: counts.voice,
    imagery: counts.imagery,
    structure: counts.structure,
    pacing: counts.pacing,
  }

  return NextResponse.json({
    history,
    averages,
    authors: Array.from(authorSet).sort(),
    dimensions_practiced: dimensionsPracticed,
  })
}
