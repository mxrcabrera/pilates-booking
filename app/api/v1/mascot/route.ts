import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { unauthorized, serverError } from '@/lib/api-utils'
import { getMascotConfig } from '@/lib/mascot-service'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const userId = await getCurrentUser()
    if (!userId) return unauthorized()

    const config = await getMascotConfig(userId)
    return NextResponse.json(config)
  } catch (error) {
    return serverError(error)
  }
}
