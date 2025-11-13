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
      }
    }
  })

  if (!user) return null

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Configuración</h1>
          <p className="page-subtitle">Administrá tu cuenta y horarios</p>
        </div>
      </div>

      <ConfiguracionClient
        profesora={{
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          telefono: user.telefono,
          horasAnticipacionMinima: user.horasAnticipacionMinima,
          maxAlumnasPorClase: user.maxAlumnasPorClase,
          horarioMananaInicio: user.horarioMananaInicio,
          horarioMananaFin: user.horarioMananaFin,
          horarioTardeInicio: user.horarioTardeInicio,
          horarioTardeFin: user.horarioTardeFin,
          espacioCompartidoId: user.espacioCompartidoId
        }}
        horarios={user.horariosDisponibles}
      />
    </div>
  )
}