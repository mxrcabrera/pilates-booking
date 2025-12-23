import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'

// POST /api/portal/[slug]/lista-espera
// Anotarse en la lista de espera para un horario lleno
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
        { error: 'Debes iniciar sesión' },
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
        maxAlumnosPorClase: true
      }
    })

    if (!profesor) {
      return NextResponse.json(
        { error: 'Profesor no encontrado' },
        { status: 404 }
      )
    }

    // Buscar alumno
    let alumno = await prisma.alumno.findFirst({
      where: {
        userId,
        profesorId: profesor.id,
        deletedAt: null
      }
    })

    // Si no existe, crear
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

      // Buscar por email
      alumno = await prisma.alumno.findFirst({
        where: {
          profesorId: profesor.id,
          email: user.email,
          deletedAt: null
        }
      })

      if (alumno && !alumno.userId) {
        alumno = await prisma.alumno.update({
          where: { id: alumno.id },
          data: { userId }
        })
      }

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

    // Verificar que el horario realmente está lleno
    const clasesEnHorario = await prisma.clase.count({
      where: {
        profesorId: profesor.id,
        fecha: fechaDate,
        horaInicio: hora,
        deletedAt: null,
        estado: { not: 'cancelada' }
      }
    })

    if (clasesEnHorario < profesor.maxAlumnosPorClase) {
      return NextResponse.json(
        { error: 'El horario tiene lugares disponibles. Podés reservar directamente.' },
        { status: 400 }
      )
    }

    // Verificar que no esté ya en lista de espera
    const yaEnEspera = await prisma.listaEspera.findFirst({
      where: {
        alumnoId: alumno.id,
        profesorId: profesor.id,
        fecha: fechaDate,
        horaInicio: hora,
        estado: 'esperando'
      }
    })

    if (yaEnEspera) {
      return NextResponse.json(
        { error: 'Ya estás en la lista de espera para este horario' },
        { status: 400 }
      )
    }

    // Verificar que no tenga reserva en ese horario
    const tieneReserva = await prisma.clase.findFirst({
      where: {
        alumnoId: alumno.id,
        fecha: fechaDate,
        horaInicio: hora,
        deletedAt: null,
        estado: { not: 'cancelada' }
      }
    })

    if (tieneReserva) {
      return NextResponse.json(
        { error: 'Ya tenés una reserva en este horario' },
        { status: 400 }
      )
    }

    // Calcular posición en la lista
    const ultimoEnEspera = await prisma.listaEspera.findFirst({
      where: {
        profesorId: profesor.id,
        fecha: fechaDate,
        horaInicio: hora,
        estado: 'esperando'
      },
      orderBy: { posicion: 'desc' }
    })

    const posicion = (ultimoEnEspera?.posicion || 0) + 1

    // Crear entrada en lista de espera
    const espera = await prisma.listaEspera.create({
      data: {
        alumnoId: alumno.id,
        profesorId: profesor.id,
        fecha: fechaDate,
        horaInicio: hora,
        posicion,
        estado: 'esperando'
      }
    })

    return NextResponse.json({
      success: true,
      posicion,
      mensaje: `Estás en la posición ${posicion} de la lista de espera`
    })
  } catch (error) {
    console.error('Error joining waitlist:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET /api/portal/[slug]/lista-espera - Ver mi posición en lista de espera
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const session = await auth()
    const userId = session?.user?.id
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')
    const hora = searchParams.get('hora')

    if (!userId) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión' },
        { status: 401 }
      )
    }

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

    const alumno = await prisma.alumno.findFirst({
      where: {
        userId,
        profesorId: profesor.id,
        deletedAt: null
      }
    })

    if (!alumno) {
      return NextResponse.json({ enEspera: [] })
    }

    // Si piden un horario específico
    if (fecha && hora) {
      const fechaDate = new Date(fecha + 'T00:00:00')
      const espera = await prisma.listaEspera.findFirst({
        where: {
          alumnoId: alumno.id,
          profesorId: profesor.id,
          fecha: fechaDate,
          horaInicio: hora,
          estado: 'esperando'
        }
      })

      return NextResponse.json({
        enEspera: espera ? [{
          id: espera.id,
          fecha,
          hora,
          posicion: espera.posicion
        }] : []
      })
    }

    // Todas las entradas en lista de espera
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const esperas = await prisma.listaEspera.findMany({
      where: {
        alumnoId: alumno.id,
        profesorId: profesor.id,
        fecha: { gte: hoy },
        estado: 'esperando'
      },
      orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }]
    })

    return NextResponse.json({
      enEspera: esperas.map(e => ({
        id: e.id,
        fecha: e.fecha.toISOString().split('T')[0],
        hora: e.horaInicio,
        posicion: e.posicion
      }))
    })
  } catch (error) {
    console.error('Error fetching waitlist:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/portal/[slug]/lista-espera?id=xxx - Salir de la lista de espera
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const session = await auth()
    const userId = session?.user?.id
    const { searchParams } = new URL(request.url)
    const esperaId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión' },
        { status: 401 }
      )
    }

    if (!esperaId) {
      return NextResponse.json(
        { error: 'ID requerido' },
        { status: 400 }
      )
    }

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

    // Verificar que la entrada existe y pertenece al alumno
    const espera = await prisma.listaEspera.findFirst({
      where: {
        id: esperaId,
        alumnoId: alumno.id,
        estado: 'esperando'
      }
    })

    if (!espera) {
      return NextResponse.json(
        { error: 'No encontrado en lista de espera' },
        { status: 404 }
      )
    }

    // Cambiar estado a cancelado
    await prisma.listaEspera.update({
      where: { id: esperaId },
      data: { estado: 'cancelado' }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error leaving waitlist:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
