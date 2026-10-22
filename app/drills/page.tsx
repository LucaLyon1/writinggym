import { redirect } from 'next/navigation'

// Drills are the home page now; keep old /drills links working.
export default function DrillsPage() {
  redirect('/')
}
