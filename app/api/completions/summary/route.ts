import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'You must be signed in to view your progress.' },
      { status: 401 }
    )
  }

  const { data, error } = await supabase
    .from('passage_completions')
    .select('passage_id, constraint_key')
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json(
      { error: error.message ?? 'Failed to fetch completion summary' },
      { status: 500 }
    )
  }

  const completedByPassage: Record<string, number> = {}
  for (const row of data ?? []) {
    completedByPassage[row.passage_id] =
      (completedByPassage[row.passage_id] ?? 0) + 1
  }

  return NextResponse.json(completedByPassage)
}
