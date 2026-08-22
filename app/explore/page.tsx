import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BrowsePageLayout } from '@/components/BrowsePageLayout'
import { ComingSoonCover } from '@/components/ComingSoonCover'
import { ExploreList } from '@/components/ExploreList'
import { fetchExploreFeed } from '@/lib/explore-feed'
import { isProdWhopChat } from '@/lib/whop'

export default async function ExplorePage() {
  if (!isProdWhopChat()) {
    redirect('/community?section=submissions')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { items, hasMore, total } = await fetchExploreFeed(user?.id ?? null)

  return (
    <ComingSoonCover active>
      <BrowsePageLayout>
        <div className="explore-root">
          <div className="explore-inner">
            <header className="explore-header">
              <h1 className="explore-title">Explore rewrites</h1>
              <p className="explore-subtitle">See how other writers tackled the same extracts.</p>
            </header>
            <ExploreList initialItems={items} initialHasMore={hasMore} initialTotal={total} />
          </div>
        </div>
      </BrowsePageLayout>
    </ComingSoonCover>
  )
}
