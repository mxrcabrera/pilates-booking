import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { rateLimit, getClientIP, rateLimitExceeded } from '@/lib/rate-limit'
import { resetPasswordSchema } from '@/lib/schemas/auth.schema'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

const RESET_LIMIT = 5
const WINDOW_MS = 60 * 1000

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const { success, resetIn } = rateLimit(`reset:${ip}`, RESET_LIMIT, WINDOW_MS)

    if (!success) {
      const { error, status, headers } = rateLimitExceeded(resetIn)
      return NextResponse.json({ error }, { status, headers })
    }

    const body = await request.json()
    const parsed = resetPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { email, token, password } = parsed.data
    const invalidResponse = { error: 'Enlace inválido o expirado. Solicitá uno nuevo.' }

    // Find token record
    const records = await prisma.verificationToken.findMany({
      where: { identifier: email }
    })

    if (records.length === 0) {
      return NextResponse.json(invalidResponse, { status: 400 })
    }

    // Compare hashed token
    const hashedToken = hashToken(token)
    const matchingRecord = records.find(r => r.token === hashedToken)

    if (!matchingRecord) {
      return NextResponse.json(invalidResponse, { status: 400 })
    }

    // Check expiration
    if (matchingRecord.expires < new Date()) {
      await prisma.verificationToken.deleteMany({ where: { identifier: email } })
      return NextResponse.json({ error: 'El enlace expiró. Solicitá uno nuevo.' }, { status: 400 })
    }

    // Verify user exists and has credentials
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true }
    })

    if (!user || !user.password) {
      return NextResponse.json(invalidResponse, { status: 400 })
    }

    // Update password and delete token
    const hashedPassword = await hashPassword(password)

    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      }),
      prisma.verificationToken.deleteMany({
        where: { identifier: email }
      })
    ])

    return NextResponse.json({
      message: 'Contraseña actualizada correctamente.',
      redirectTo: '/login'
    })
  } catch (error) {
    logger.error('Error in reset-password', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
