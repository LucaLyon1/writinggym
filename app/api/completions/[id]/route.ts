import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'You must be signed in to delete submissions.' },
      { status: 401 }
    )
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: 'Missing submission id' }, { status: 400 })
  }

  const { error } = await supabase
    .from('passage_completions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json(
      { error: error.message ?? 'Failed to delete submission' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
