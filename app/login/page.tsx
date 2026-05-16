import { AuthPageFrame } from '@/components/auth/AuthPageFrame'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  return <AuthPageFrame mode="login" next={next} />
}
