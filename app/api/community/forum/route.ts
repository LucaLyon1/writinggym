import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPublicForumPost, listPublicForumPosts } from '@/lib/whop-forum'
import { getValidWhopUserAccessToken } from '@/lib/whop-oauth'

export async function GET(request: Request) {
  const parentId = new URL(request.url).searchParams.get('parent_id') ?? undefined
  try {
    const posts = await listPublicForumPosts(parentId)
    return NextResponse.json({ posts })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load forum'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Sign in to post.' }, { status: 401 })
  }

  const accessToken = await getValidWhopUserAccessToken(user.id)
  if (!accessToken) {
    return NextResponse.json(
      { error: 'Connect your Whop account to comment as yourself.', connect: '/api/whop/oauth/start' },
      { status: 403 }
    )
  }

  const body = (await request.json()) as { content?: string; title?: string; parentId?: string }
  const content = body.content?.trim() ?? ''
  if (!content) {
    return NextResponse.json({ error: 'Write something first.' }, { status: 400 })
  }

  try {
    const post = await createPublicForumPost({
      content,
      title: body.title?.trim() || undefined,
      parentId: body.parentId,
      userAccessToken: accessToken,
    })
    return NextResponse.json({ post })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to post'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
