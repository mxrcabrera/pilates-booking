import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getEffectiveFeatures } from '@/lib/plans'
import { EquipoClient } from './equipo-client'

export default async function EquipoPage() {
  const userId = await getCurrentUser()
  if (!userId) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, trialEndsAt: true }
  })

  if (!user) redirect('/login')

  const features = getEffectiveFeatures(user.plan, user.trialEndsAt)

  if (!features.multiUsuarios) {
    return (
      <div className="page-container">
        <div className="premium-gate">
          <div className="premium-gate-icon">👥</div>
          <h2>Gestión de Equipo</h2>
          <p>Invita colaboradores a tu estudio con diferentes roles y permisos.</p>
          <p className="premium-gate-plan">Disponible en el plan Estudio</p>
          <a href="/planes" className="btn-primary">
            Ver planes
          </a>
        </div>
      </div>
    )
  }

  return <EquipoClient />
}
