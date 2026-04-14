import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { passages } from '@/data/passages'

interface FeedbackShape {
  strong_points?: string[]
  weak_points?: string[]
  verdict?: string
}

interface CompletionRow {
  id: string
  passage_id: string
  completed_at: string
  feedback: FeedbackShape | null
}

export interface SessionSnapshot {
  date: string
  passage_id: string
  passage_title: string
  author: string
  verdict: string | null
  had_feedback: boolean
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Sign in to view your practice history.' },
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

  const history: SessionSnapshot[] = []

  for (const row of (data ?? []) as CompletionRow[]) {
    const passage = passageMap.get(row.passage_id)

    history.push({
      date: row.completed_at,
      passage_id: row.passage_id,
      passage_title: passage?.title ?? row.passage_id,
      author: passage?.author ?? 'Unknown',
      verdict: row.feedback?.verdict ?? null,
      had_feedback: row.feedback != null,
    })
  }

  const authorSet = new Set<string>()
  for (const snap of history) {
    if (snap.author !== 'Unknown') authorSet.add(snap.author)
  }

  return NextResponse.json({
    history,
    session_count: history.length,
    sessions_with_feedback: history.filter((h) => h.had_feedback).length,
    authors: Array.from(authorSet).sort(),
  })
}
