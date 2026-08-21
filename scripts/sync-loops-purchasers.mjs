import nextEnv from '@next/env'
import { createClient } from '@supabase/supabase-js'
import { LoopsClient } from 'loops'

const { loadEnvConfig } = nextEnv
loadEnvConfig(process.cwd())

const apply = process.argv.includes('--apply')
const help = process.argv.includes('--help') || process.argv.includes('-h')

if (help) {
  console.log(`Usage: npm run sync:loops-purchasers -- [--apply]

Without --apply, prints a read-only plan for all active or trialing
subscriptions. With --apply, upserts those purchasers into the Loops paid
userGroup. The operation is idempotent and safe to rerun.`)
  process.exit(0)
}

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const loopsApiKey = process.env.LOOPS_API_KEY
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
}
if (apply && !loopsApiKey) {
  throw new Error('LOOPS_API_KEY is required with --apply')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const loops = loopsApiKey ? new LoopsClient(loopsApiKey) : null

const { data: subscriptions, error } = await supabase
  .from('subscriptions')
  .select('user_id, plan_id, status, billing_provider')
  .in('status', ['active', 'trialing'])
  .order('created_at', { ascending: true })

if (error) throw error

console.log(`${apply ? 'Applying' : 'Dry run:'} ${subscriptions.length} purchaser(s)`)

let failed = 0
for (const subscription of subscriptions) {
  const label = [
    subscription.user_id.slice(0, 8),
    subscription.billing_provider,
    subscription.plan_id,
    subscription.status,
  ].join(' | ')

  if (!apply) {
    console.log(`would sync | ${label}`)
    continue
  }

  try {
    if (!loops) throw new Error('Loops client is not configured')
    const { data, error: userError } = await supabase.auth.admin.getUserById(
      subscription.user_id
    )
    if (userError) throw userError
    if (!data.user?.email) throw new Error('Purchaser has no email address')

    await loops.updateContact({
      email: data.user.email,
      userId: subscription.user_id,
      properties: { userGroup: 'Core User' },
    })
    console.log(`updated | ${label}`)
  } catch (syncError) {
    failed += 1
    const message = syncError instanceof Error ? syncError.message : 'Unknown error'
    console.error(`failed | ${label} | ${message}`)
  }
}

if (!apply) {
  console.log('No Loops contacts were changed. Re-run with --apply after reviewing this list.')
}

if (failed > 0) {
  throw new Error(`${failed} purchaser(s) failed to sync`)
}
