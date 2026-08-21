import { supabaseAdmin } from '@/lib/supabase-admin'
import { syncLoopsBillingContact } from '@/lib/loops-billing'

export async function syncBillingContactForUser(input: {
  status: string
  userId: string
}) {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(input.userId)

  if (error) {
    throw new Error(`Unable to load billing contact: ${error.message}`)
  }

  const email = data.user?.email
  if (!email) {
    throw new Error(`Billing contact ${input.userId} has no email address`)
  }

  return syncLoopsBillingContact({
    email,
    status: input.status,
    userId: input.userId,
  })
}
