import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export default async function AlumnoDashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: {
      id: true,
      nombre: true,
      email: true,
      role: true,
    },
  })

  if (!user || user.role !== 'ALUMNO') {
    redirect('/dashboard')
  }

  // Obtener las próximas reservas del alumno
  const reservas = await prisma.reserva.findMany({
    where: {
      alumnoUserId: user.id,
      fecha: {
        gte: new Date(),
      },
      estado: 'confirmada',
    },
    include: {
      profesor: {
        select: {
          nombre: true,
          email: true,
        },
      },
    },
    orderBy: [
      { fecha: 'asc' },
      { horaInicio: 'asc' },
    ],
    take: 10,
  })

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Hola, {user.nombre}!</h1>
        <p className="dashboard-subtitle">Estas son tus próximas clases</p>
      </div>

      <div className="dashboard-content">
        {reservas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h2>No tenés clases reservadas</h2>
            <p>Cuando reserves tu primera clase, aparecerá aquí</p>
          </div>
        ) : (
          <div className="reservas-list">
            {reservas.map((reserva) => (
              <div key={reserva.id} className="reserva-card">
                <div className="reserva-fecha">
                  <span className="reserva-dia">
                    {new Date(reserva.fecha).toLocaleDateString('es-AR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
                <div className="reserva-info">
                  <div className="reserva-hora">{reserva.horaInicio} - {reserva.horaFin}</div>
                  <div className="reserva-profesor">Con {reserva.profesor.nombre}</div>
                  {reserva.notasAlumno && (
                    <div className="reserva-notas">{reserva.notasAlumno}</div>
                  )}
                </div>
                <div className="reserva-estado">
                  <span className="badge badge-success">Confirmada</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
