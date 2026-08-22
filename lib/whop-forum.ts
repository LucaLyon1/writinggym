import { getWhopClient, WHOP_PUBLIC_FORUM_EXPERIENCE_ID } from '@/lib/whop'
import { whopClientFromUserToken } from '@/lib/whop-oauth'

export interface WhopForumPost {
  id: string
  title: string | null
  content: string | null
  parent_id: string | null
  is_pinned: boolean
  comment_count: number
  like_count: number | null
  view_count: number | null
  created_at?: string
  user: {
    id: string
    name: string | null
    username: string
  } | null
}

function asPost(raw: Record<string, unknown>): WhopForumPost {
  const user = raw.user as WhopForumPost['user'] | undefined
  return {
    id: String(raw.id),
    title: (raw.title as string | null) ?? null,
    content: (raw.content as string | null) ?? null,
    parent_id: (raw.parent_id as string | null) ?? null,
    is_pinned: Boolean(raw.is_pinned),
    comment_count: Number(raw.comment_count ?? 0),
    like_count: (raw.like_count as number | null) ?? 0,
    view_count: (raw.view_count as number | null) ?? 0,
    created_at: raw.created_at as string | undefined,
    user: user ?? null,
  }
}

export async function listPublicForumPosts(parentId?: string): Promise<WhopForumPost[]> {
  if (!process.env.WHOP_API_KEY) return []
  const client = getWhopClient()
  const params: { experience_id: string; first: number; parent_id?: string } = {
    experience_id: WHOP_PUBLIC_FORUM_EXPERIENCE_ID,
    first: 20,
  }
  if (parentId) params.parent_id = parentId

  const posts: WhopForumPost[] = []
  for await (const post of client.forumPosts.list(params)) {
    posts.push(asPost(post as unknown as Record<string, unknown>))
    if (posts.length >= 20) break
  }
  return posts
}

export async function createPublicForumPost(input: {
  content: string
  title?: string
  parentId?: string
  userAccessToken: string
}): Promise<WhopForumPost> {
  const created = await whopClientFromUserToken(input.userAccessToken).forumPosts.create({
    experience_id: WHOP_PUBLIC_FORUM_EXPERIENCE_ID,
    content: input.content,
    title: input.title,
    parent_id: input.parentId,
  })
  return asPost(created as unknown as Record<string, unknown>)
}
