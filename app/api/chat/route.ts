import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { isPaidUser } from '@/lib/plan'

const SYSTEM_PROMPT = `You are a literary craft expert helping a writer deepen their understanding of a specific writing exercise they just completed.

You have access to:
- The ORIGINAL EXTRACT (a published literary passage)
- The CONSTRAINT (the writing exercise)
- The USER'S WRITING (their attempt)
- The FEEDBACK they received (analysis of their strengths, weaknesses, and divergences from the original)

Your role is to answer follow-up questions about craft, technique, and the specific passage. You should:

1. Be specific and concrete — always reference the actual text when possible
2. Explain craft concepts in plain language, avoiding unnecessary jargon
3. Draw connections between the original passage and the user's attempt
4. Offer practical, actionable insights the writer can use
5. Be honest but encouraging — treat the user as a serious student of craft

You are NOT a general chatbot. Stay focused on writing craft and the specific passage being discussed. If asked about unrelated topics, redirect to the exercise.

Keep responses concise (2-4 paragraphs max). Writers learn better from sharp, focused insight than from lengthy lectures.`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not set.' },
      { status: 500 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Sign in to use the follow-up chat.' },
      { status: 401 }
    )
  }

  const paid = await isPaidUser(user.id)
  if (!paid) {
    return NextResponse.json(
      {
        error: 'Follow-up chat is available on the Core plan.',
        upgradeUrl: '/pricing',
        requiresUpgrade: true,
      },
      { status: 403 }
    )
  }

  const body = (await request.json()) as {
    originalText: string
    constraint: string
    userText: string
    feedbackSummary: string
    messages: ChatMessage[]
  }

  if (!body.originalText || !body.constraint || !body.messages?.length) {
    return NextResponse.json(
      { error: 'Missing required fields.' },
      { status: 400 }
    )
  }

  const contextMessage = `Here is the context for this conversation:

ORIGINAL EXTRACT:
${body.originalText}

CONSTRAINT (the exercise):
${body.constraint}

USER'S WRITING:
${body.userText || '(not yet written)'}

FEEDBACK RECEIVED:
${body.feedbackSummary || '(no feedback yet)'}`

  const client = new Anthropic({ apiKey })

  try {
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: contextMessage },
      { role: 'assistant', content: 'I have the context. What would you like to explore about this passage or your writing?' },
      ...body.messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json(
        { error: 'No response from Claude.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ reply: textBlock.text })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `API error: ${msg}` },
      { status: 502 }
    )
  }
}
