import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { OnboardingClient } from './onboarding-client'

export default async function OnboardingPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return <OnboardingClient user={session.user} />
}
