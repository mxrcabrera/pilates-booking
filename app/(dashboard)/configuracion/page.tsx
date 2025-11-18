import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ConfiguracionClient } from './configuracion-client'

export default async function ConfiguracionPage() {
  const userId = await getCurrentUser()
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      horariosDisponibles: {
        orderBy: [
          { diaSemana: 'asc' },
          { horaInicio: 'asc' }
        ]
      },
      packs: {
        orderBy: {
          createdAt: 'desc'
        }
      },
      accounts: {
        select: {
          provider: true
        }
      }
    }
  })

  if (!user) return null

  // Check if user has a Google account linked
  const hasGoogleAccount = user.accounts.some(account => account.provider === 'google')

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Configuración</h1>
          <p className="page-subtitle">Administrá tu cuenta y horarios</p>
        </div>
      </div>

      <ConfiguracionClient
        profesor={{
          id: user.id,
          horasAnticipacionMinima: user.horasAnticipacionMinima,
          maxAlumnosPorClase: user.maxAlumnosPorClase,
          horarioMananaInicio: user.horarioMananaInicio,
          horarioMananaFin: user.horarioMananaFin,
          horarioTardeInicio: user.horarioTardeInicio,
          horarioTardeFin: user.horarioTardeFin,
          espacioCompartidoId: user.espacioCompartidoId,
          syncGoogleCalendar: user.syncGoogleCalendar,
          hasGoogleAccount
        }}
        horarios={user.horariosDisponibles}
        packs={user.packs.map(pack => ({
          id: pack.id,
          nombre: pack.nombre,
          clasesPorSemana: pack.clasesPorSemana,
          precio: pack.precio.toString(),
          estaActivo: pack.estaActivo
        }))}
      />
    </div>
  )
}