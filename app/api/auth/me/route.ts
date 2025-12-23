import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getErrorMessage } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { PLAN_CONFIGS, getDaysLeftInTrial, isTrialActive, getEffectiveFeatures, getEffectiveMaxAlumnos } from '@/lib/plans'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const userId = await getCurrentUser()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
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
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
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
    logger.error('Auth me error', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}
