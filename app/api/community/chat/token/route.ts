import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWhopClient, WHOP_ACCOUNT_ID } from '@/lib/whop'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Sign in to join chat.' }, { status: 401 })
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('external_customer_id')
    .eq('user_id', user.id)
    .eq('billing_provider', 'whop')
    .maybeSingle()

  const whopUserId = subscription?.external_customer_id
  if (!whopUserId || !whopUserId.startsWith('user_')) {
    return NextResponse.json(
      { error: 'Your Whop membership is not linked yet.' },
      { status: 403 }
    )
  }

  try {
    const { token } = await getWhopClient().accessTokens.create({
      company_id: WHOP_ACCOUNT_ID,
      user_id: whopUserId,
      scoped_actions: [
        'chat:message:create',
        'chat:read',
        'support_chat:read',
        'support_chat:message:create',
      ],
    })
    return NextResponse.json({ token })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start chat'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
