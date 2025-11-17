import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Calendar, Users, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const userId = await getCurrentUser()
  
  if (!userId) {
    return null
  }

  const hoy = format(new Date(), 'yyyy-MM-dd')
  
  const totalAlumnos = await prisma.alumno.count({
    where: {
      profesorId: userId,
      estaActivo: true
    }
  })

  const clasesHoy = await prisma.clase.findMany({
    where: {
      profesorId: userId,
      fecha: new Date(hoy)
    },
    include: {
      alumno: {
        select: {
          nombre: true
        }
      }
    },
    orderBy: {
      horaInicio: 'asc'
    }
  })

  const pagosVencidos = await prisma.pago.count({
    where: {
      alumno: {
        profesorId: userId
      },
      estado: 'vencido'
    }
  })

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Bienvenida</h1>
          <p className="date-text">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Alumnos Activos</p>
            <p className="stat-value">{totalAlumnos}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Clases Hoy</p>
            <p className="stat-value">{clasesHoy.length}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pink">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Pagos Pendientes</p>
            <p className="stat-value">{pagosVencidos}</p>
          </div>
        </div>
      </div>

      <div className="agenda-card">
        {clasesHoy.length > 0 ? (
          <DashboardClient clasesHoy={clasesHoy} />
        ) : (
          <div className="empty-state">
            <Calendar size={48} strokeWidth={1} />
            <p>No tenés clases programadas para hoy</p>
            <p className="empty-subtitle">Disfrutá tu día libre</p>
          </div>
        )}
      </div>
    </div>
  )
}