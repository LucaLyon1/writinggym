import { redirect } from 'next/navigation'

export default function ExplorePage() {
  redirect('/community?section=submissions')
}
