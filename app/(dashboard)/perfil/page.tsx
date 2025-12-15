import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { PerfilClient } from './perfil-client'

export default async function PerfilPage() {
  const userId = await getCurrentUser()
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nombre: true,
      email: true,
      telefono: true
    }
  })

  if (!user) return null

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Mi Perfil</h1>
          <p className="page-subtitle">Administrá tu información personal</p>
        </div>
      </div>

      <PerfilClient profesor={user} />
    </div>
  )
}
