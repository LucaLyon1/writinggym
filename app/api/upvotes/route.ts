import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Sign in to upvote.' }, { status: 401 })
  }

  const { completionId } = (await request.json()) as { completionId?: string }
  if (!completionId) {
    return NextResponse.json({ error: 'Missing completionId' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('upvotes')
    .select('id')
    .eq('user_id', user.id)
    .eq('completion_id', completionId)
    .maybeSingle()

  if (existing) {
    await supabase.from('upvotes').delete().eq('id', existing.id)
    const { count } = await supabase
      .from('upvotes')
      .select('*', { count: 'exact', head: true })
      .eq('completion_id', completionId)
    return NextResponse.json({ upvoted: false, count: count ?? 0 })
  }

  await supabase.from('upvotes').insert({ user_id: user.id, completion_id: completionId })
  const { count } = await supabase
    .from('upvotes')
    .select('*', { count: 'exact', head: true })
    .eq('completion_id', completionId)
  return NextResponse.json({ upvoted: true, count: count ?? 0 })
}
