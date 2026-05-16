import { redirect } from 'next/navigation'
import { AuthPageFrame } from '@/components/auth/AuthPageFrame'
import { createClient } from '@/lib/supabase/server'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/')

  const { next } = await searchParams
  return <AuthPageFrame mode="signup" next={next} />
}
