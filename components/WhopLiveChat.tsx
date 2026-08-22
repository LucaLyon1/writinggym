'use client'

import { useMemo } from 'react'
import { ChatElement, ChatSession, Elements } from '@whop/embedded-components-react-js'
import { loadWhopElements } from '@whop/embedded-components-vanilla-js'
import styles from './WhopForumPreview.module.css'

const elements = loadWhopElements()

async function getToken() {
  const response = await fetch('/api/community/chat/token', { method: 'POST' })
  const data = (await response.json()) as { token?: string; error?: string }
  if (!response.ok || !data.token) {
    throw new Error(data.error ?? 'Could not start chat')
  }
  return data.token
}

export function WhopLiveChat({ channelId }: { channelId: string }) {
  const options = useMemo(() => ({ channelId, style: 'discord' as const }), [channelId])

  return (
    <div className={styles.liveChat}>
      <Elements
        elements={elements}
        appearance={{
          theme: {
            appearance: 'light',
            accentColor: 'bronze',
            grayColor: 'sand',
          },
          variables: {
            '--radius-1': '0px',
            '--radius-2': '0px',
            '--radius-3': '0px',
            '--radius-4': '0px',
            '--radius-5': '0px',
            '--radius-6': '0px',
            '--default-border-width': '0px',
          },
        }}
      >
        <ChatSession token={getToken}>
          <ChatElement
            options={options}
            style={{ height: '100%', width: '100%', background: 'transparent', border: 'none', borderRadius: 0 }}
          />
        </ChatSession>
      </Elements>
    </div>
  )
}
