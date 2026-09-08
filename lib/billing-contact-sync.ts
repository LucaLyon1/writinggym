import { supabaseAdmin } from '@/lib/supabase-admin'
import { syncLoopsBillingContact } from '@/lib/loops-billing'
import { syncResendBillingContact } from '@/lib/resend-billing'

const PAID_STATUSES = new Set(['active', 'trialing'])

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

export async function syncBillingContactForUser(input: {
  status: string
  userId: string
  planId?: string | null
}) {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(input.userId)

  if (error) {
    throw new Error(`Unable to load billing contact: ${error.message}`)
  }

  const email = data.user?.email
  if (!email) {
    throw new Error(`Billing contact ${input.userId} has no email address`)
  }

  const planId = await resolvePlanIdForUser(input.userId, input.planId, input.status)

  const [loops, resend] = await Promise.all([
    syncLoopsBillingContact({
      email,
      status: input.status,
      userId: input.userId,
    }),
    syncResendBillingContact({
      email,
      status: input.status,
      planId,
    }),
  ])

  return { loops, resend }
}
