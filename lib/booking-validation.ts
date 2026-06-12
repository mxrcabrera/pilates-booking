import { prisma } from '@/lib/prisma'

export interface PlanValidationResult {
  activo: boolean
  motivo?: string
}

/**
 * Valida si el alumno tiene un plan activo para reservar
 * @param alumnoId - ID del alumno
 * @param estudioId - ID del estudio (para multi-tenant)
 * @returns Resultado de la validación
 */
export async function validarPlanAlumno(
  alumnoId: string,
  estudioId: string
): Promise<PlanValidationResult> {
  // Buscar el pago más reciente del alumno en el estudio con estado 'pagado'
  const pago = await prisma.pago.findFirst({
    where: {
      alumnoId,
      estudioId,
      estado: 'pagado',
      deletedAt: null,
    },
    orderBy: {
      fechaVencimiento: 'desc',
    },
  })

  // Si no encuentra pagos
  if (!pago) {
    return {
      activo: false,
      motivo: 'No tienes un plan activo.',
    }
  }

  // Comparar fecha de vencimiento con fecha actual
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0) // Normalizar a medianoche

  const fechaVencimiento = new Date(pago.fechaVencimiento)
  fechaVencimiento.setHours(0, 0, 0, 0) // Normalizar a medianoche

  // Calcular diferencia en días
  const diferenciaDias = Math.floor(
    (hoy.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Si la diferencia es mayor a 30 días, el plan está vencido
  if (diferenciaDias > 30) {
    return {
      activo: false,
      motivo: 'Tu pack mensual ha vencido.',
    }
  }

  // Si está dentro del rango, el plan está activo
  return {
    activo: true,
  }
}
