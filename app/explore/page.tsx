import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ExploreList } from '@/components/ExploreList'

const PAGE_SIZE = 12

interface ExploreItem {
  id: string
  user_text: string | null
  word_count: number | null
  completed_at: string
  passage_id: string
  constraint_key: string
  upvote_count: number
  viewer_has_upvoted: boolean
}

async function fetchInitialItems(userId: string | null): Promise<{
  items: ExploreItem[]
  hasMore: boolean
  total: number
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('passage_completions')
    .select('id, user_text, word_count, completed_at, passage_id, constraint_key, upvotes(count)')
    .eq('is_public', true)

  if (error || !data) return { items: [], hasMore: false, total: 0 }

  const sorted: ExploreItem[] = data
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

  const page = sorted.slice(0, PAGE_SIZE)

  if (userId && page.length > 0) {
    const ids = page.map((c) => c.id)
    const { data: myUpvotes } = await supabase
      .from('upvotes')
      .select('completion_id')
      .eq('user_id', userId)
      .in('completion_id', ids)
    const voted = new Set((myUpvotes ?? []).map((u) => u.completion_id))
    for (const item of page) {
      item.viewer_has_upvoted = voted.has(item.id)
    }
  }

  return { items: page, hasMore: sorted.length > PAGE_SIZE, total: sorted.length }
}

export default async function ExplorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { items, hasMore, total } = await fetchInitialItems(user?.id ?? null)

  return (
    <div className="explore-root">
      <div className="explore-inner">
        <Link href="/" className="profile-back-link">← Back to passages</Link>
        <header className="explore-header">
          <h1 className="explore-title">Explore rewrites</h1>
          <p className="explore-subtitle">
            See how other writers tackled the same extracts. Ordered by upvotes.
          </p>
        </header>
        <ExploreList
          initialItems={items}
          initialHasMore={hasMore}
          initialTotal={total}
        />
      </div>
    </div>
  )
}
