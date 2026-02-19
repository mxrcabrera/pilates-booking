import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIP, rateLimitExceeded } from '@/lib/rate-limit'
import { forgotPasswordSchema } from '@/lib/schemas/auth.schema'
import { sendPasswordResetEmail } from '@/lib/services/email'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

const FORGOT_LIMIT = 3
const WINDOW_MS = 60 * 1000
const TOKEN_EXPIRY_MS = 60 * 60 * 1000 // 1 hour

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const { success, resetIn } = rateLimit(`forgot:${ip}`, FORGOT_LIMIT, WINDOW_MS)

    if (!success) {
      const { error, status, headers } = rateLimitExceeded(resetIn)
      return NextResponse.json({ error }, { status, headers })
    }

    const body = await request.json()
    const parsed = forgotPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { email } = parsed.data
    const genericResponse = { message: 'Si el email existe, te enviamos un enlace para restablecer tu contraseña.' }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true }
    })

    // Don't leak whether user exists
    if (!user) {
      return NextResponse.json(genericResponse)
    }

    // OAuth-only users don't have a password to reset
    if (!user.password) {
      return NextResponse.json(genericResponse)
    }

    // Delete any existing tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email }
    })

    // Generate secure token
    const rawToken = randomBytes(32).toString('hex')
    const hashedToken = hashToken(rawToken)

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashedToken,
        expires: new Date(Date.now() + TOKEN_EXPIRY_MS)
      }
    })

    const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`

    const sent = await sendPasswordResetEmail(email, resetUrl)
    if (!sent) {
      logger.warn('Failed to send password reset email', { email })
    }

    return NextResponse.json(genericResponse)
  } catch (error) {
    logger.error('Error in forgot-password', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
