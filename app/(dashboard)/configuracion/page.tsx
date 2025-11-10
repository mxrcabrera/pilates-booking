import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProfileForm } from './profile-form'
import { PasswordForm } from './password-form'
import { HorariosSection } from './horarios-section'

export default async function ConfiguracionPage() {
  const userId = await getCurrentUser()
  if (!userId) return null

  const profesora = await prisma.profesora.findUnique({
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

  if (!profesora) return null

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Configuración</h1>
          <p className="page-subtitle">Administrá tu cuenta y horarios</p>
        </div>
      </div>

      <div className="settings-grid">
        <ProfileForm profesora={profesora} />
        <PasswordForm />
        <HorariosSection horarios={profesora.horariosDisponibles} />
      </div>
    </div>
  )
}