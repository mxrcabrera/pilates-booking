import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMascotConfig } from '@/lib/mascot-service'
import { PerfilClient } from './perfil-client'

export const metadata: Metadata = {
  title: 'Perfil | Pilates Booking'
}

export default async function PerfilPage() {
  const userId = await getCurrentUser()
  if (!userId) return null

  const [user, mascot] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        avatarUrl: true,
        buddyName: true,
      },
    }),
    getMascotConfig(userId),
  ])

  if (!user) return null

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Mi Perfil</h1>
          <p className="page-subtitle">Administrá tu información personal</p>
        </div>
      </div>

      <PerfilClient
        profesor={{
          ...user,
          buddyName: mascot.buddyName,
          mascotImages: mascot.images,
          mascotRules: mascot.rules,
        }}
      />
    </div>
  )
}
