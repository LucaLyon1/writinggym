import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
  const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10))
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') ?? '5', 10)))

  const { data, error } = await supabase
    .from('passage_completions')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json(
      { error: error.message ?? 'Failed to fetch submissions' },
      { status: 500 }
    )
  }

  return NextResponse.json(data ?? [])
}
