import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const SOURCE_EMAIL = 'cabreramxr@gmail.com'
const NEW_EMAIL = 'demo@pilates.com'
const NEW_PASSWORD = 'demo123'
const NEW_NAME = 'Usuario Demo'

async function main() {
  console.log('🔍 Buscando usuario origen:', SOURCE_EMAIL)

  const sourceUser = await prisma.user.findUnique({
    where: { email: SOURCE_EMAIL },
    include: {
      packs: true,
      horariosDisponibles: true,
      alumnos: {
        include: {
          clases: true,
          pagos: true
        }
      }
    }
  })

  if (!sourceUser) {
    console.error('❌ Usuario origen no encontrado')
    process.exit(1)
  }

  console.log('✅ Usuario origen encontrado')
  console.log(`   - Packs: ${sourceUser.packs.length}`)
  console.log(`   - Horarios: ${sourceUser.horariosDisponibles.length}`)
  console.log(`   - Alumnos: ${sourceUser.alumnos.length}`)

  // Verificar si ya existe el usuario destino
  const existingUser = await prisma.user.findUnique({
    where: { email: NEW_EMAIL }
  })

  if (existingUser) {
    console.log('⚠️  Usuario destino ya existe, eliminando...')
    await prisma.user.delete({ where: { email: NEW_EMAIL } })
  }

  // Hash de la contraseña
  const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10)

  console.log('📝 Creando nuevo usuario...')

  // Crear nuevo usuario con los mismos datos de configuración
  const newUser = await prisma.user.create({
    data: {
      email: NEW_EMAIL,
      nombre: NEW_NAME,
      password: hashedPassword,
      telefono: sourceUser.telefono,
      genero: sourceUser.genero,
      role: sourceUser.role,
      horasAnticipacionMinima: sourceUser.horasAnticipacionMinima,
      maxAlumnosPorClase: sourceUser.maxAlumnosPorClase,
      horarioMananaInicio: sourceUser.horarioMananaInicio,
      horarioMananaFin: sourceUser.horarioMananaFin,
      turnoMananaActivo: sourceUser.turnoMananaActivo,
      horarioTardeInicio: sourceUser.horarioTardeInicio,
      horarioTardeFin: sourceUser.horarioTardeFin,
      turnoTardeActivo: sourceUser.turnoTardeActivo,
      precioPorClase: sourceUser.precioPorClase,
      syncGoogleCalendar: false
    }
  })

  console.log('✅ Usuario creado:', newUser.id)

  // Copiar packs
  console.log('📦 Copiando packs...')
  for (const pack of sourceUser.packs) {
    await prisma.pack.create({
      data: {
        profesorId: newUser.id,
        nombre: pack.nombre,
        clasesPorSemana: pack.clasesPorSemana,
        precio: pack.precio
      }
    })
  }
  console.log(`   ✅ ${sourceUser.packs.length} packs copiados`)

  // Copiar horarios
  console.log('📅 Copiando horarios...')
  for (const horario of sourceUser.horariosDisponibles) {
    await prisma.horarioDisponible.create({
      data: {
        profesorId: newUser.id,
        diaSemana: horario.diaSemana,
        horaInicio: horario.horaInicio,
        horaFin: horario.horaFin,
        esManiana: horario.esManiana,
        estaActivo: horario.estaActivo
      }
    })
  }
  console.log(`   ✅ ${sourceUser.horariosDisponibles.length} horarios copiados`)

  // Copiar alumnos con sus clases y pagos
  console.log('👥 Copiando alumnos...')
  let totalClases = 0
  let totalPagos = 0

  for (const alumno of sourceUser.alumnos) {
    const newAlumno = await prisma.alumno.create({
      data: {
        profesorId: newUser.id,
        nombre: alumno.nombre,
        email: alumno.email,
        telefono: alumno.telefono,
        cumpleanos: alumno.cumpleanos,
        patologias: alumno.patologias,
        packType: alumno.packType,
        clasesPorMes: alumno.clasesPorMes,
        precio: alumno.precio,
        estaActivo: alumno.estaActivo,
        estaPausada: alumno.estaPausada,
        genero: alumno.genero,
        consentimientoTutor: alumno.consentimientoTutor,
        syncGoogleCalendar: false
      }
    })

    // Copiar clases del alumno
    for (const clase of alumno.clases) {
      await prisma.clase.create({
        data: {
          profesorId: newUser.id,
          alumnoId: newAlumno.id,
          fecha: clase.fecha,
          horaInicio: clase.horaInicio,
          horaRecurrente: clase.horaRecurrente,
          esRecurrente: clase.esRecurrente,
          frecuenciaSemanal: clase.frecuenciaSemanal,
          diasSemana: clase.diasSemana,
          estado: clase.estado,
          asistencia: clase.asistencia,
          esClasePrueba: clase.esClasePrueba
        }
      })
      totalClases++
    }

    // Copiar pagos del alumno
    for (const pago of alumno.pagos) {
      await prisma.pago.create({
        data: {
          alumnoId: newAlumno.id,
          monto: pago.monto,
          fechaPago: pago.fechaPago,
          fechaVencimiento: pago.fechaVencimiento,
          estado: pago.estado,
          mesCorrespondiente: pago.mesCorrespondiente,
          tipoPago: pago.tipoPago,
          clasesEsperadas: pago.clasesEsperadas
        }
      })
      totalPagos++
    }
  }

  console.log(`   ✅ ${sourceUser.alumnos.length} alumnos copiados`)
  console.log(`   ✅ ${totalClases} clases copiadas`)
  console.log(`   ✅ ${totalPagos} pagos copiados`)

  console.log('\n🎉 ¡Listo!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📧 Email: ${NEW_EMAIL}`)
  console.log(`🔑 Contraseña: ${NEW_PASSWORD}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
