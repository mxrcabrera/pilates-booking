import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PlanesClient } from './planes-client'
import { getDaysLeftInTrial, isTrialActive } from '@/lib/plans'

export const metadata: Metadata = {
  title: 'Planes | Pilates Booking'
}

export default async function PlanesPage() {
  const userId = await getCurrentUser()
  if (!userId) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      trialEndsAt: true,
    }
  })

  if (!user) redirect('/login')

  const inTrial = isTrialActive(user.trialEndsAt)
  const trialDaysLeft = getDaysLeftInTrial(user.trialEndsAt)

  return (
    <PlanesClient
      userPlan={user.plan}
      inTrial={inTrial}
      trialDaysLeft={trialDaysLeft}
    />
  )
}
