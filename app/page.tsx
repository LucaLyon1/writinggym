import { HomeBrowse } from '@/components/HomeBrowse'
import { Onboarding } from '@/components/Onboarding'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <>
      {user && <Onboarding />}
      <HomeBrowse />
    </>
  )
}
