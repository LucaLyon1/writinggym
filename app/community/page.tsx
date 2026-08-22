import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { fetchExploreFeed } from '@/lib/explore-feed'
import { listPublicForumPosts } from '@/lib/whop-forum'
import { getCommunityChatChannelId, isProdWhopChat } from '@/lib/whop'
import { ComingSoonCover } from '@/components/ComingSoonCover'
import { WhopForumPreview } from '@/components/WhopForumPreview'

export const metadata: Metadata = {
  title: 'Community — ProseLab',
  description: 'Explore rewrites, talk craft, and share work with the ProseLab community.',
}

export default async function CommunityPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const [explore, forumPosts, subscription, profileResult, statsResult, firstPageResult] = await Promise.all([
    fetchExploreFeed(user?.id ?? null),
    listPublicForumPosts().catch(() => []),
    user
      ? supabase
          .from('subscriptions')
          .select('external_customer_id')
          .eq('user_id', user.id)
          .eq('billing_provider', 'whop')
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from('profiles')
          .select('current_streak, longest_streak, total_passages_done, username, avatar_url')
          .eq('id', user.id)
          .single()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from('passage_completions')
          .select('completed_at, word_count')
          .eq('user_id', user.id)
      : Promise.resolve({ data: [] }),
    user
      ? supabase
          .from('passage_completions')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .range(0, 4)
      : Promise.resolve({ data: [] }),
  ])

  const canChat = Boolean(subscription.data?.external_customer_id?.startsWith('user_'))
  const profile = profileResult.data
  const statsCompletions = statsResult.data ?? []
  const totalWordsWritten = statsCompletions.reduce((sum, c) => sum + (c.word_count ?? 0), 0)
  const totalCount = Math.max(statsCompletions.length, profile?.total_passages_done ?? 0)

  return (
    <Suspense>
      <ComingSoonCover active={isProdWhopChat()}>
        <WhopForumPreview
          explore={explore}
          forumPosts={forumPosts}
          chatChannelId={getCommunityChatChannelId()}
          canChat={canChat}
          newsAuthor={{
            name: 'ProseLab Team',
            avatarUrl: '/Proselab.png',
          }}
          profile={
            user
              ? {
                  username: profile?.username ?? null,
                  avatarUrl: profile?.avatar_url ?? (user.user_metadata?.avatar_url as string | undefined) ?? null,
                  currentStreak: profile?.current_streak ?? 0,
                  longestStreak: profile?.longest_streak ?? 0,
                  totalWordsWritten,
                  totalPassages: totalCount,
                  completions: statsCompletions,
                  firstPageCompletions: firstPageResult.data ?? [],
                }
              : null
          }
        />
      </ComingSoonCover>
    </Suspense>
  )
}
