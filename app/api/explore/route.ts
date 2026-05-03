import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PAGE_SIZE = 12

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10))

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch all public completions with upvote counts.
  // We sort by upvote count in JS because PostgREST does not support
  // ordering by aggregate of an embedded relation. A DB view would be
  // the scalable upgrade path when the dataset grows.
  const { data, error } = await supabase
    .from('passage_completions')
    .select('id, user_text, word_count, completed_at, passage_id, constraint_key, upvotes(count)')
    .eq('is_public', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  type Row = {
    id: string
    user_text: string | null
    word_count: number | null
    completed_at: string
    passage_id: string
    constraint_key: string
    upvote_count: number
    viewer_has_upvoted: boolean
  }

  const sorted: Row[] = (data ?? [])
    .map((c) => ({
      id: c.id,
      user_text: c.user_text,
      word_count: c.word_count,
      completed_at: c.completed_at,
      passage_id: c.passage_id,
      constraint_key: c.constraint_key,
      upvote_count: (c.upvotes as unknown as { count: number }[])[0]?.count ?? 0,
      viewer_has_upvoted: false,
    }))
    .sort(
      (a, b) =>
        b.upvote_count - a.upvote_count ||
        new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    )

  const page = sorted.slice(offset, offset + PAGE_SIZE)

  // Resolve which items the current viewer has upvoted
  if (user && page.length > 0) {
    const ids = page.map((c) => c.id)
    const { data: myUpvotes } = await supabase
      .from('upvotes')
      .select('completion_id')
      .eq('user_id', user.id)
      .in('completion_id', ids)
    const voted = new Set((myUpvotes ?? []).map((u) => u.completion_id))
    for (const item of page) {
      item.viewer_has_upvoted = voted.has(item.id)
    }
  }

  return NextResponse.json({
    items: page,
    hasMore: sorted.length > offset + PAGE_SIZE,
    total: sorted.length,
  })
}
