import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import LandingPage from './landing/page'

export default async function Home() {
  const userId = await getCurrentUser()

  console.log('[HOME]', { userId })

  if (userId) {
    console.log('[HOME REDIRECT DASHBOARD]')
    redirect('/dashboard')
  }

  console.log('[HOME RENDER LANDING]')
  return <LandingPage />
}