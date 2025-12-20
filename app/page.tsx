import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default async function Home() {
  const userId = await getCurrentUser()

  if (userId) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}