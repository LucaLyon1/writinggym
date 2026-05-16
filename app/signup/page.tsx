import { AuthPageFrame } from '@/components/auth/AuthPageFrame'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  return <AuthPageFrame mode="signup" next={next} />
}
