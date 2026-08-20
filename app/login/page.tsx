import { redirect } from 'next/navigation'
import { AuthPageFrame } from '@/components/auth/AuthPageFrame'
import { createClient } from '@/lib/supabase/server'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect(safeNext)

  return <AuthPageFrame mode="login" next={safeNext === '/' ? undefined : safeNext} />
}
