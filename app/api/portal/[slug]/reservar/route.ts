import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { sendEmail } from '@/lib/email'
import { getEffectiveFeatures } from '@/lib/plans'

// POST /api/portal/[slug]/reservar
// Body: { fecha: "2024-01-15", hora: "10:00" }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para reservar' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { fecha, hora } = body

    if (!fecha || !hora) {
      return NextResponse.json(
        { error: 'Fecha y hora son requeridos' },
        { status: 400 }
      )
    }

    // Validar formato de fecha
    const fechaDate = new Date(fecha + 'T00:00:00')
    if (isNaN(fechaDate.getTime())) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido' },
        { status: 400 }
      )
    }

    // Obtener profesor
    const profesor = await prisma.user.findFirst({
      where: {
        slug,
        portalActivo: true,
        role: 'PROFESOR'
      },
      select: {
        id: true,
        nombre: true,
        horasAnticipacionMinima: true,
        maxAlumnosPorClase: true,
        plan: true,
        trialEndsAt: true
      }
    })

    if (!profesor) {
      return NextResponse.json(
        { error: 'Profesor no encontrado' },
        { status: 404 }
      )
    }

    // Buscar si el usuario ya es alumno de este profesor
    let alumno = await prisma.alumno.findFirst({
      where: {
        userId,
        profesorId: profesor.id,
        deletedAt: null
      }
    })

    // Si no existe el alumno, buscarlo por email del usuario
    if (!alumno) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, nombre: true, telefono: true, genero: true }
      })

      if (!user) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        )
      }

      // Buscar alumno por email
      alumno = await prisma.alumno.findFirst({
        where: {
          profesorId: profesor.id,
          email: user.email,
          deletedAt: null
        }
      })

      // Si existe el alumno pero no está vinculado, vincularlo
      if (alumno && !alumno.userId) {
        alumno = await prisma.alumno.update({
          where: { id: alumno.id },
          data: { userId }
        })
      }

      // Si no existe, crear nuevo alumno
      if (!alumno) {
        alumno = await prisma.alumno.create({
          data: {
            profesorId: profesor.id,
            userId,
            nombre: user.nombre,
            email: user.email,
            telefono: user.telefono || '',
            genero: user.genero || 'F',
            packType: 'clase',
            precio: 0,
            estaActivo: true
          }
        })
      }
    }

    // Verificar anticipación mínima
    const ahora = new Date()
    const [h, m] = hora.split(':').map(Number)
    const horaClase = new Date(fechaDate)
    horaClase.setHours(h, m, 0, 0)
    const horaMinima = new Date(ahora.getTime() + profesor.horasAnticipacionMinima * 60 * 60 * 1000)

    if (horaClase < horaMinima) {
      return NextResponse.json(
        { error: `Debes reservar con al menos ${profesor.horasAnticipacionMinima} hora(s) de anticipación` },
        { status: 400 }
      )
    }

    // Verificar disponibilidad (cantidad de alumnos)
    const clasesEnHorario = await prisma.clase.count({
      where: {
        profesorId: profesor.id,
        fecha: fechaDate,
        horaInicio: hora,
        deletedAt: null,
        estado: { not: 'cancelada' }
      }
    })

    if (clasesEnHorario >= profesor.maxAlumnosPorClase) {
      return NextResponse.json(
        { error: 'Este horario ya está completo' },
        { status: 400 }
      )
    }

    // Verificar que el alumno no tenga ya una clase en ese horario
    const claseExistente = await prisma.clase.findFirst({
      where: {
        alumnoId: alumno.id,
        fecha: fechaDate,
        horaInicio: hora,
        deletedAt: null,
        estado: { not: 'cancelada' }
      }
    })

    if (claseExistente) {
      return NextResponse.json(
        { error: 'Ya tenés una reserva en este horario' },
        { status: 400 }
      )
    }

    // Crear la clase
    const clase = await prisma.clase.create({
      data: {
        profesorId: profesor.id,
        alumnoId: alumno.id,
        fecha: fechaDate,
        horaInicio: hora,
        estado: 'reservada',
        asistencia: 'pendiente'
      }
    })

    // Si estaba en lista de espera, marcar como confirmado
    await prisma.listaEspera.updateMany({
      where: {
        alumnoId: alumno.id,
        profesorId: profesor.id,
        fecha: fechaDate,
        horaInicio: hora,
        estado: { in: ['esperando', 'notificado'] }
      },
      data: {
        estado: 'confirmado'
      }
    })

    // Enviar email de confirmación (solo si el plan lo permite)
    const features = getEffectiveFeatures(profesor.plan, profesor.trialEndsAt)
    if (features.notificacionesEmail && alumno.email) {
      const fechaFormateada = fechaDate.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })
      sendEmail({
        template: 'reserva-confirmada',
        to: alumno.email,
        alumnoNombre: alumno.nombre,
        fecha: fechaFormateada,
        hora,
        profesorNombre: profesor.nombre
      }).catch(err => console.error('[Email] Error sending confirmation:', err))
    }

    return NextResponse.json({
      success: true,
      clase: {
        id: clase.id,
        fecha: fecha,
        hora: hora,
        profesor: profesor.nombre
      }
    })
  } catch (error) {
    console.error('Error creating reserva:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET /api/portal/[slug]/reservar - Obtener reservas del usuario actual
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión' },
        { status: 401 }
      )
    }

    // Obtener profesor
    const profesor = await prisma.user.findFirst({
      where: {
        slug,
        portalActivo: true,
        role: 'PROFESOR'
      },
      select: { id: true }
    })

    if (!profesor) {
      return NextResponse.json(
        { error: 'Profesor no encontrado' },
        { status: 404 }
      )
    }

    // Buscar alumno vinculado
    const alumno = await prisma.alumno.findFirst({
      where: {
        userId,
        profesorId: profesor.id,
        deletedAt: null
      }
    })

    if (!alumno) {
      return NextResponse.json({ reservas: [] })
    }

    // Obtener reservas futuras
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const reservas = await prisma.clase.findMany({
      where: {
        alumnoId: alumno.id,
        fecha: { gte: hoy },
        deletedAt: null,
        estado: { not: 'cancelada' }
      },
      select: {
        id: true,
        fecha: true,
        horaInicio: true,
        estado: true
      },
      orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }]
    })

    return NextResponse.json({
      reservas: reservas.map(r => ({
        id: r.id,
        fecha: r.fecha.toISOString().split('T')[0],
        hora: r.horaInicio,
        estado: r.estado
      }))
    })
  } catch (error) {
    console.error('Error fetching reservas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/portal/[slug]/reservar?id=xxx - Cancelar reserva
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const session = await auth()
    const userId = session?.user?.id
    const { searchParams } = new URL(request.url)
    const claseId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión' },
        { status: 401 }
      )
    }

    if (!claseId) {
      return NextResponse.json(
        { error: 'ID de clase requerido' },
        { status: 400 }
      )
    }

    // Obtener profesor
    const profesor = await prisma.user.findFirst({
      where: {
        slug,
        portalActivo: true,
        role: 'PROFESOR'
      },
      select: {
        id: true,
        nombre: true,
        horasAnticipacionMinima: true,
        plan: true,
        trialEndsAt: true
      }
    })

    if (!profesor) {
      return NextResponse.json(
        { error: 'Profesor no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el alumno es dueño de la reserva
    const alumno = await prisma.alumno.findFirst({
      where: {
        userId,
        profesorId: profesor.id,
        deletedAt: null
      }
    })

    if (!alumno) {
      return NextResponse.json(
        { error: 'No sos alumno de este profesor' },
        { status: 403 }
      )
    }

    // Verificar que la clase existe y pertenece al alumno
    const clase = await prisma.clase.findFirst({
      where: {
        id: claseId,
        alumnoId: alumno.id,
        deletedAt: null,
        estado: { not: 'cancelada' }
      }
    })

    if (!clase) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      )
    }

    // Verificar anticipación mínima para cancelar
    const ahora = new Date()
    const [h, m] = clase.horaInicio.split(':').map(Number)
    const horaClase = new Date(clase.fecha)
    horaClase.setHours(h, m, 0, 0)
    const horaMinima = new Date(ahora.getTime() + profesor.horasAnticipacionMinima * 60 * 60 * 1000)

    if (horaClase < horaMinima) {
      return NextResponse.json(
        { error: `No podés cancelar con menos de ${profesor.horasAnticipacionMinima} hora(s) de anticipación` },
        { status: 400 }
      )
    }

    // Cancelar la clase
    await prisma.clase.update({
      where: { id: claseId },
      data: { estado: 'cancelada' }
    })

    // Enviar email de cancelación (solo si el plan lo permite)
    const features = getEffectiveFeatures(profesor.plan, profesor.trialEndsAt)
    if (features.notificacionesEmail && alumno.email) {
      const fechaFormateada = clase.fecha.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })
      sendEmail({
        template: 'reserva-cancelada',
        to: alumno.email,
        alumnoNombre: alumno.nombre,
        fecha: fechaFormateada,
        hora: clase.horaInicio,
        profesorNombre: profesor.nombre
      }).catch(err => console.error('[Email] Error sending cancellation:', err))
    }

    // Notificar al primero en lista de espera
    const fechaStr = clase.fecha.toISOString().split('T')[0]
    const primerEnEspera = await prisma.listaEspera.findFirst({
      where: {
        profesorId: profesor.id,
        fecha: clase.fecha,
        horaInicio: clase.horaInicio,
        estado: 'esperando'
      },
      orderBy: { posicion: 'asc' },
      include: {
        alumno: {
          select: { nombre: true, email: true, userId: true }
        }
      }
    })

    if (primerEnEspera && primerEnEspera.alumno.userId) {
      // Actualizar estado en lista de espera
      const expiraEn = new Date()
      expiraEn.setHours(expiraEn.getHours() + 2) // 2 horas para confirmar

      await prisma.listaEspera.update({
        where: { id: primerEnEspera.id },
        data: {
          estado: 'notificado',
          notificadoEn: new Date(),
          expiraEn
        }
      })

      // Crear notificación para el alumno
      await prisma.notificacion.create({
        data: {
          userId: primerEnEspera.alumno.userId,
          tipo: 'LUGAR_DISPONIBLE',
          titulo: '¡Se liberó un lugar!',
          mensaje: `Hay un lugar disponible el ${fechaStr} a las ${clase.horaInicio}. Tenés 2 horas para reservar.`
        }
      })

      // Enviar email de lista de espera (solo si el plan lo permite)
      if (features.notificacionesEmail && primerEnEspera.alumno.email) {
        const fechaFormateada = clase.fecha.toLocaleDateString('es-AR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        })
        sendEmail({
          template: 'lista-espera-lugar',
          to: primerEnEspera.alumno.email,
          alumnoNombre: primerEnEspera.alumno.nombre,
          fecha: fechaFormateada,
          hora: clase.horaInicio,
          profesorNombre: profesor.nombre
        }).catch(err => console.error('[Email] Error sending waitlist notification:', err))
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error canceling reserva:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
