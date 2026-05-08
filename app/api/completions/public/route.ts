import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { constraintKey } from '@/lib/constraint-key'
import { COMPLETION_AUTHOR_PROFILE_SELECT, completionAuthorFromProfileEmbed } from '@/lib/completion-author'

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
    .select(`id, user_text, word_count, completed_at, upvotes(count), ${COMPLETION_AUTHOR_PROFILE_SELECT}`)
    .eq('passage_id', passageId)
    .eq('constraint_key', key)
    .eq('is_public', true)
    .order('completed_at', { ascending: false })
    .limit(10)

  const { data, error } = await baseQuery

  if (error) {
    return NextResponse.json(
      { error: error.message ?? 'Failed to fetch public submissions' },
      { status: 500 }
    )
  }

  const completions = data ?? []

  // If signed in, fetch which of these completions the viewer has upvoted
  let viewerUpvotedIds = new Set<string>()
  if (user && completions.length > 0) {
    const ids = completions.map((c) => c.id)
    const { data: myUpvotes } = await supabase
      .from('upvotes')
      .select('completion_id')
      .eq('user_id', user.id)
      .in('completion_id', ids)
    viewerUpvotedIds = new Set((myUpvotes ?? []).map((u) => u.completion_id))
  }

  const result = completions.map((c) => {
    const author = completionAuthorFromProfileEmbed(
      (c as { profiles?: unknown }).profiles
    )
    return {
      id: c.id,
      user_text: c.user_text,
      word_count: c.word_count,
      completed_at: c.completed_at,
      upvote_count: (c.upvotes as unknown as { count: number }[])[0]?.count ?? 0,
      viewer_has_upvoted: viewerUpvotedIds.has(c.id),
      ...author,
    }
  })

  return NextResponse.json(result)
}
