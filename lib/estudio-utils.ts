/**
 * Utilidades para trabajar con estudios y multi-usuario
 * (Preparado para implementación futura)
 */

import type { EstudioRol } from '@prisma/client'

export interface EstudioQueryContext {
  userId: string
  estudioId: string | null
  rol: EstudioRol | null
  whereEstudio: { estudioId: string } | { profesorId: string }
}
