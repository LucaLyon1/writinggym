'use client'

import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { SidebarNav } from '@/components/AppSidebar'
import { ExploreList } from '@/components/ExploreList'
import { ProfileSidebar } from '@/components/profile/ProfileSidebar'
import { useSidebar } from '@/components/SidebarContext'
import type { ExploreFeedItem } from '@/lib/explore-feed'
import type { WhopForumPost } from '@/lib/whop-forum'
import { WhopLiveChat } from '@/components/WhopLiveChat'
import { CompletionHeatmap } from '@/components/CompletionHeatmap'
import { ProfileSubmissionsList } from '@/components/ProfileSubmissionsList'
import type { Tables } from '@/types/database.types'
import styles from './WhopForumPreview.module.css'

type SectionId = 'submissions' | 'general' | 'announcements' | 'profile'

export type CommunityProfile = {
  username: string | null
  avatarUrl: string | null
  currentStreak: number
  longestStreak: number
  totalWordsWritten: number
  totalPassages: number
  completions: { completed_at: string; word_count: number | null }[]
  firstPageCompletions: Tables<'passage_completions'>[]
}

const SECTIONS: { id: SectionId; label: string; description: string; kind: 'explore' | 'chat' | 'forum' | 'profile' }[] = [
  { id: 'announcements', label: 'News Feed', description: 'Notes from ProseLab.', kind: 'forum' },
  { id: 'general', label: 'General Chat', description: 'Live chat with other writers.', kind: 'chat' },
  { id: 'submissions', label: 'Submissions', description: 'See how other writers tackled the same extracts.', kind: 'explore' },
]

function parseSection(value: string | null): SectionId {
  if (value === 'explore' || value === 'submissions') return 'submissions'
  if (value === 'general') return 'general'
  if (value === 'profile') return 'profile'
  if (value === 'announcements' || value === 'news' || value === 'public') return 'announcements'
  return 'announcements'
}

function initials(name: string | null | undefined) {
  const parts = (name || 'W').trim().split(/\s+/)
  return ((parts[0]?.[0] ?? 'W') + (parts[1]?.[0] ?? '')).toUpperCase()
}

function formatPostDate(value?: string) {
  if (!value) return null
  const numeric = Number(value)
  const date = Number.isFinite(numeric) && numeric > 0
    ? new Date(numeric < 1e12 ? numeric * 1000 : numeric)
    : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function WhopForumPreview({
  explore,
  forumPosts,
  chatChannelId,
  canChat,
  profile,
  newsAuthor,
}: {
  explore: { items: ExploreFeedItem[]; hasMore: boolean; total: number }
  forumPosts: WhopForumPost[]
  chatChannelId: string
  canChat: boolean
  profile: CommunityProfile | null
  newsAuthor: { name: string; avatarUrl: string | null }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setOpen: setSidebarOpen } = useSidebar()
  const activeSection = parseSection(searchParams.get('section'))
  const section = useMemo(() => {
    if (activeSection === 'profile') {
      return {
        id: 'profile' as const,
        label: profile?.username || 'Profile',
        description: 'Your writing, streaks, and submissions.',
        kind: 'profile' as const,
      }
    }
    return SECTIONS.find((item) => item.id === activeSection) ?? SECTIONS[0]
  }, [activeSection, profile?.username])

  const feedPosts = useMemo(() => {
    return [...forumPosts].sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned))
  }, [forumPosts])

  function selectSection(id: SectionId) {
    setSidebarOpen(false)
    router.replace(`/community?section=${id}`)
  }

  return (
    <div className="analysis-view account-shell">
      <div className="ea-root">
        <div className="ea-page-layout">
          <ProfileSidebar>
            <span className="sidebar-label">Community</span>
            {SECTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`cat-btn${activeSection === item.id ? ' active' : ''}`}
                onClick={() => selectSection(item.id)}
              >
                <span className="cat-btn-label">{item.label}</span>
              </button>
            ))}
            <SidebarNav />
          </ProfileSidebar>

          <main className="ea-center-col">
            <section className={`ea-stage${section.kind === 'chat' ? ` ${styles.chatStage}` : ''}`}>
              <header className="ea-stage-head">
                <h2 className="ea-stage-title">{section.label}</h2>
                <p className={styles.lede}>{section.description}</p>
              </header>

              <div className="ea-stage-body profile-stage-body">
                {section.kind === 'profile' && profile && (
                  <>
                    <div className="profile-bio-section">
                      <div className="profile-bio-avatar" aria-hidden="true">
                        {profile.avatarUrl ? (
                          <img src={profile.avatarUrl} alt="" className="profile-bio-avatar-img" referrerPolicy="no-referrer" />
                        ) : (
                          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="40" cy="30" r="14" fill="currentColor" opacity="0.25" />
                            <ellipse cx="40" cy="62" rx="22" ry="14" fill="currentColor" opacity="0.18" />
                          </svg>
                        )}
                      </div>
                      <div className="profile-bio-info">
                        <h2 className="profile-username-heading">{profile.username || 'Set a username'}</h2>
                      </div>
                    </div>
                    {!profile.totalPassages ? (
                      <div className="profile-empty">
                        <p>You haven&apos;t completed any passages yet.</p>
                        <Link href="/" className="profile-empty-link">
                          Browse passages and start writing
                        </Link>
                      </div>
                    ) : (
                      <ProfileSubmissionsList initialCompletions={profile.firstPageCompletions} />
                    )}
                  </>
                )}

                {section.kind === 'explore' && (
                  <ExploreList
                    initialItems={explore.items}
                    initialHasMore={explore.hasMore}
                    initialTotal={explore.total}
                  />
                )}

                {section.kind === 'chat' && (
                  canChat ? (
                    <WhopLiveChat channelId={chatChannelId} />
                  ) : (
                    <p className={styles.lede}>
                      Sign in with an active ProseLab plan to join General chat.
                    </p>
                  )
                )}

                {section.kind === 'forum' && (
                  <>
                    {feedPosts.length === 0 && (
                      <p className={styles.lede}>No news yet.</p>
                    )}
                    {feedPosts.map((post) => (
                      <article className={styles.threadHero} key={post.id}>
                        <div className={`${styles.avatar} ${styles.ink}`}>
                          {newsAuthor.avatarUrl ? (
                            <img src={newsAuthor.avatarUrl} alt="" className={styles.avatarImg} referrerPolicy="no-referrer" />
                          ) : (
                            initials(newsAuthor.name)
                          )}
                        </div>
                        <div>
                          <div className={styles.metaRow}>
                            {post.is_pinned && <span className={styles.pin}>Pinned</span>}
                            <span>{newsAuthor.name}</span>
                            {formatPostDate(post.created_at) && <span>{formatPostDate(post.created_at)}</span>}
                          </div>
                          {post.content && (
                            <div className={styles.postBody}>
                              <ReactMarkdown
                                remarkPlugins={[remarkBreaks]}
                                components={{
                                  br: () => <span className={styles.softBreak} />,
                                }}
                              >
                                {post.content}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </>
                )}
              </div>
            </section>
          </main>

          <aside className="ea-right-col">
            {profile && (
              <CompletionHeatmap
                completions={profile.completions}
                currentStreak={profile.currentStreak}
                longestStreak={profile.longestStreak}
                totalWordsWritten={profile.totalWordsWritten}
                totalPassages={profile.totalPassages}
              >
                <button
                  type="button"
                  className={`${styles.youRow}${activeSection === 'profile' ? ` ${styles.youRowActive}` : ''}`}
                  onClick={() => selectSection('profile')}
                >
                  <span className={styles.youAvatar}>
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="" referrerPolicy="no-referrer" />
                    ) : (
                      initials(profile.username)
                    )}
                  </span>
                  <span className={styles.youMeta}>
                    <strong>{profile.username || 'Set a username'}</strong>
                    <small>You · {profile.totalPassages} passages</small>
                  </span>
                </button>
              </CompletionHeatmap>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
