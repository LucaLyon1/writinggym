import { supabaseAdmin } from '@/lib/supabase-admin'
import { syncLoopsBillingContact } from '@/lib/loops-billing'
import { syncResendBillingContact } from '@/lib/resend-billing'

const PAID_STATUSES = new Set(['active', 'trialing'])

type LoopsSync = typeof syncLoopsBillingContact
type ResendSync = typeof syncResendBillingContact
type UserLookupResult = {
  data: { user: { email?: string | null } | null }
  error: { message: string } | null
}
type UserLookup = (userId: string) => Promise<UserLookupResult>

export type BillingContactSyncDeps = {
  getUserById?: UserLookup
  syncLoops?: LoopsSync
  syncResend?: ResendSync
}

export type BillingContactProviderResult =
  | Awaited<ReturnType<LoopsSync>>
  | Awaited<ReturnType<ResendSync>>
  | { outcome: 'failed'; error: string }

export type BillingContactSyncResult = {
  loops: BillingContactProviderResult
  resend: BillingContactProviderResult
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function settleContactSync(
  provider: 'Loops' | 'Resend',
  task: () => Promise<BillingContactProviderResult>
): Promise<BillingContactProviderResult> {
  try {
    return await task()
  } catch (error) {
    console.error(`[billing-contact-sync] ${provider} sync failed:`, error)
    return { outcome: 'failed', error: errorMessage(error) }
  }
}

async function resolvePlanIdForUser(
  userId: string,
  planId: string | null | undefined,
  status: string
): Promise<string | null> {
  if (planId?.trim()) return planId.trim()

  const normalizedStatus = status.trim().toLowerCase()
  if (!PAID_STATUSES.has(normalizedStatus)) return null

  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('plan_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Unable to load subscription plan_id: ${error.message}`)
  }

  return typeof data?.plan_id === 'string' ? data.plan_id : null
}

/**
 * Keep Loops and Resend contacts aligned with billing access. Failures are
 * logged and returned so a contact-provider outage cannot abort a webhook
 * after the subscription has already been written, or skip recording the
 * event in `billing_webhook_events`.
 */
export async function syncBillingContactForUser(
  input: {
    status: string
    userId: string
    planId?: string | null
  },
  deps: BillingContactSyncDeps = {}
): Promise<BillingContactSyncResult> {
  try {
    const getUserById = deps.getUserById ?? ((userId: string) =>
      supabaseAdmin.auth.admin.getUserById(userId)
    )
    const { data, error } = await getUserById(input.userId)

    if (error) {
      throw new Error(`Unable to load billing contact: ${error.message}`)
    }

    const email = data.user?.email
    if (!email) {
      throw new Error(`Billing contact ${input.userId} has no email address`)
    }

    const planId = await resolvePlanIdForUser(input.userId, input.planId, input.status)
    const syncLoops = deps.syncLoops ?? syncLoopsBillingContact
    const syncResend = deps.syncResend ?? syncResendBillingContact

    const [loops, resend] = await Promise.all([
      settleContactSync('Loops', () =>
        syncLoops({
          email,
          status: input.status,
          userId: input.userId,
        })
      ),
      settleContactSync('Resend', () =>
        syncResend({
          email,
          status: input.status,
          planId,
        })
      ),
    ])

    return { loops, resend }
  } catch (error) {
    console.error('[billing-contact-sync] Unable to sync billing contact:', error)
    const failed = { outcome: 'failed' as const, error: errorMessage(error) }
    return { loops: failed, resend: failed }
  }
}
