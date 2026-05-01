import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { constraintKey } from '@/lib/constraint-key'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const passageId = searchParams.get('passageId')
  const constraint = searchParams.get('constraint')

  if (!passageId || !constraint) {
    return NextResponse.json(
      { error: 'Missing passageId or constraint' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const key = constraintKey(constraint)

  const { data: { user } } = await supabase.auth.getUser()

  const baseQuery = supabase
    .from('passage_completions')
    .select('id, user_text, word_count, completed_at')
    .eq('passage_id', passageId)
    .eq('constraint_key', key)
    .eq('is_public', true)
    .order('completed_at', { ascending: false })
    .limit(10)

  const { data, error } = user
    ? await baseQuery.neq('user_id', user.id)
    : await baseQuery

  if (error) {
    return NextResponse.json(
      { error: error.message ?? 'Failed to fetch public submissions' },
      { status: 500 }
    )
  }

  return NextResponse.json(data ?? [])
}
