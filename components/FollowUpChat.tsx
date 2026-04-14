'use client'

import { useState, useRef, useEffect } from 'react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface FollowUpChatProps {
  originalText: string
  constraint: string
  userText: string
  feedbackSummary: string
}

const SUGGESTED_QUESTIONS = [
  'Why does pace matter in this passage specifically?',
  'What technique is the author using here and what is it called?',
  'How could I rewrite my weakest sentence to match the original\'s approach?',
  'What would a different author have done differently with this material?',
]

export function FollowUpChat({ originalText, constraint, userText, feedbackSummary }: FollowUpChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return

    const userMsg: ChatMessage = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText,
          constraint,
          userText,
          feedbackSummary,
          messages: newMessages,
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to get response')
      }

      const data = (await res.json()) as { reply: string }
      setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  if (!expanded) {
    return (
      <button className="fc-expand-btn" onClick={() => setExpanded(true)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Ask a follow-up question about this passage
      </button>
    )
  }

  return (
    <div className="fc-root">
      <div className="fc-header">
        <h3 className="fc-title">Craft deep dive</h3>
        <button className="fc-close" onClick={() => setExpanded(false)}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="2" y1="2" x2="12" y2="12" />
            <line x1="12" y1="2" x2="2" y2="12" />
          </svg>
        </button>
      </div>

      {messages.length === 0 && (
        <div className="fc-suggestions">
          <p className="fc-suggestions-label">Try asking:</p>
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              className="fc-suggestion"
              onClick={() => sendMessage(q)}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="fc-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`fc-message fc-message-${msg.role}`}>
              <p className="fc-message-text">{msg.content}</p>
            </div>
          ))}
          {loading && (
            <div className="fc-message fc-message-assistant">
              <p className="fc-message-text fc-typing">Thinking…</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {error && <p className="fc-error">{error}</p>}

      <div className="fc-input-row">
        <input
          className="fc-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
          placeholder="Ask about craft, technique, or this passage…"
          disabled={loading}
        />
        <button
          className="fc-send"
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
        >
          →
        </button>
      </div>
    </div>
  )
}
