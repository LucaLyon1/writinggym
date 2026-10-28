/**
 * lib/dev-auth.ts
 *
 * Development-only auto-login. When `next dev` runs and no session exists,
 * middleware signs the browser in as a seeded demo account so every page can
 * be poked at without going through signup.
 *
 * - Only runs when NODE_ENV === 'development' and SUPABASE_SERVICE_ROLE_KEY is set.
 * - Disable entirely with DEV_AUTO_LOGIN=0 in .env.local.
 * - Logging out sets DEV_LOGGED_OUT_COOKIE so you can view logged-out pages;
 *   visit DEV_LOGIN_PATH to clear it and sign back in as the demo user.
 *
 * Edge-safe: middleware runs on the edge runtime, so this uses Web Crypto and
 * builds its own admin client instead of importing lib/supabase-admin.
 */

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

export const DEMO_EMAIL = 'dev-demo@example.com'
export const DEMO_USERNAME = 'demo_writer'
export const DEV_LOGIN_PATH = '/dev/login'
export const DEV_LOGGED_OUT_COOKIE = 'pl_dev_logged_out'

export function isDevAutoLoginEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.DEV_AUTO_LOGIN !== '0' &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

/** Whether this request should be auto-signed-in (respects the logged-out opt-out cookie). */
export function shouldAutoLogin(request: NextRequest): boolean {
  if (!isDevAutoLoginEnabled()) return false
  if (request.nextUrl.pathname === DEV_LOGIN_PATH) return true
  return !request.cookies.has(DEV_LOGGED_OUT_COOKIE)
}

function createDevAdminClient(): SupabaseClient<Database> {
  return createClient<Database>(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Ensure the demo user exists, then mint a session for it on the given
 * cookie-backed client. Returns the signed-in user, or null on failure.
 */
export async function signInDemoUser(supabase: SupabaseClient<Database>): Promise<User | null> {
  try {
    const admin = createDevAdminClient()

    const { error: createError } = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      email_confirm: true,
      user_metadata: { full_name: 'Demo Writer', dev_demo: true },
    })
    if (createError && createError.code !== 'email_exists') throw createError

    // generateLink never sends an email; we exchange its token directly.
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: DEMO_EMAIL,
    })
    if (linkError) throw linkError

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: link.properties.hashed_token,
      type: 'magiclink',
    })
    if (verifyError) throw verifyError
    if (!data.user) return null

    await seedDemoData(admin, data.user.id)
    return data.user
  } catch (error) {
    console.error('[dev-auth] demo auto-login failed:', error)
    return null
  }
}

// ── Placeholder data ─────────────────────────────────────────
// Real passage ids + twist prompts from data/passages so completions link up.

const SAMPLE_COMPLETIONS = [
  {
    passageId: 'hemingway-hills',
    constraint:
      "Rewrite it so the characters say exactly what they mean. No subtext, no evasion. Notice what direct speech costs the scene.",
    text: "\"I don't want to do this,\" she said.\n\"I know. I want you to,\" he said.\nThe beer went warm between them. Saying it hadn't made anything easier; it had only made it smaller.",
  },
  {
    passageId: 'tolstoy-anna',
    constraint:
      "Describe a character using only physical details — height, hair, clothes, hands. No effect on others, no aura. Can you still make them magnetic?",
    text: "She was shorter than the door frame by a hand's width. Her coat was green wool, darned at the left cuff with thread a shade too dark. She kept her thumbnail pressed into the side of her finger as if holding a place in a book.",
  },
  {
    passageId: 'woolf-waves',
    constraint:
      "Rewrite it as someone waking up in a room — no sea, no sky. But keep the same quality of attention to gradual, shifting light.",
    text: "The room was not yet a room. Then the ceiling separated itself from the dark, grey first, then the colour of weak tea, and the chair by the window became a chair, holding yesterday's shirt like a hand held out.",
  },
  {
    passageId: 'carver-what-we-talk',
    constraint:
      "Have someone in the room actually answer the question. What would that answer be? Does answering it kill the scene?",
    text: "\"It's who you call when the car breaks down at two in the morning,\" Laura said. Nobody looked at her. Mel poured the last of the gin and the light kept leaving the kitchen.",
  },
  {
    passageId: 'didion-bethlehem',
    constraint:
      "Rewrite it set in one specific, ordinary place — a laundromat, a parking lot. Keep the philosophical weight, but anchor it completely.",
    text: "At the Suds-n-Duds on Fifth the dryers turn whether or not anyone is waiting. A woman folds a child's shirt she has folded before. The centre was not holding here either; it was simply open until ten.",
  },
  {
    passageId: 'poetry-003',
    constraint:
      "Start with a grand question, then narrow to something even smaller than Oliver's grasshopper — a mite, a seed, a grain of sand. Match her specificity of description.",
    text: "Who decided the shape of the tide?\nNot this grain of sand, three-sided, honey-coloured,\nwhich has been a mountain and will be glass,\nand which, this morning, is lodged in the crease of my palm\nlike a question I forgot I asked.",
  },
]

const DAY_MS = 24 * 60 * 60 * 1000

function isoDate(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * DAY_MS).toISOString().slice(0, 10)
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Fill in anything missing; never overwrites data you changed while poking around. */
async function seedDemoData(admin: SupabaseClient<Database>, userId: string): Promise<void> {
  await admin.from('profiles').upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true })
  await admin
    .from('profiles')
    .update({ username: DEMO_USERNAME, post_trial_choice_at: new Date().toISOString() })
    .eq('id', userId)
    .is('username', null)

  // Comp premium subscription: no external billing ids, so billing treats it as manual.
  const { data: sub } = await admin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .maybeSingle()
  if (!sub) {
    await admin.from('subscriptions').insert({
      user_id: userId,
      plan_id: 'premium',
      status: 'active',
      billing_provider: 'stripe',
    })
  }

  const { count } = await admin
    .from('passage_completions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  if (count) return

  // Recent three-day streak, plus a scattering over the past few weeks for the heatmap.
  const daysAgo = [0, 1, 2, 5, 9, 16]
  const completions = await Promise.all(
    SAMPLE_COMPLETIONS.map(async (c, i) => ({
      user_id: userId,
      passage_id: c.passageId,
      constraint_key: await sha256Hex(c.constraint.trim()),
      user_text: c.text,
      word_count: c.text.split(/\s+/).filter(Boolean).length,
      completed_at: new Date(Date.now() - daysAgo[i] * DAY_MS).toISOString(),
      is_public: false,
    }))
  )
  await admin.from('passage_completions').insert(completions)

  await admin.from('daily_stats').upsert(
    completions.map((c, i) => ({
      user_id: userId,
      stat_date: isoDate(daysAgo[i]),
      sessions: 1,
      passages_practiced: 1,
      words_written: c.word_count,
    })),
    { onConflict: 'user_id,stat_date', ignoreDuplicates: true }
  )

  await admin
    .from('profiles')
    .update({
      current_streak: 3,
      longest_streak: 3,
      total_passages_done: completions.length,
      total_sessions: completions.length,
      last_active_date: isoDate(0),
    })
    .eq('id', userId)
}
