import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { unauthorized, notFound, serverError } from '@/lib/api-utils'
import { PLAN_CONFIGS, getDaysLeftInTrial, isTrialActive, getEffectiveFeatures, getEffectiveMaxAlumnos } from '@/lib/plans'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const userId = await getCurrentUser()
    if (!userId) {
      return unauthorized()
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        plan: true,
        trialEndsAt: true,
        role: true,
      }
    })

    if (!user) {
      return notFound('Usuario no encontrado')
    }

    const planConfig = PLAN_CONFIGS[user.plan]
    const inTrial = isTrialActive(user.trialEndsAt)
    const daysLeft = getDaysLeftInTrial(user.trialEndsAt)
    const features = getEffectiveFeatures(user.plan, user.trialEndsAt)
    const maxAlumnos = getEffectiveMaxAlumnos(user.plan, user.trialEndsAt)

    return NextResponse.json({
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role,
        plan: user.plan,
        planName: planConfig.name,
        inTrial,
        trialDaysLeft: daysLeft,
        features: {
          ...features,
          maxAlumnos,
        },
      }
    })
  } catch (error) {
    return serverError(error)
  }
}
