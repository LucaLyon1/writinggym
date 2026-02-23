import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Admin Supabase client with service role key.
 * Server-only: use for passage_analyses and other backend operations.
 * Never expose this client or its key to the client bundle.
 */
function createAdminClient() {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Admin client requires both.'
    )
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export const supabaseAdmin = createAdminClient()
