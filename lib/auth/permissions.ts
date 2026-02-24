import type { EstudioRol } from '@prisma/client'

const PERMISSIONS = {
  OWNER: [
    'view:all', 'create:alumnos', 'edit:alumnos', 'delete:alumnos',
    'create:clases', 'edit:clases', 'edit:clases:all', 'delete:clases',
    'create:pagos', 'edit:pagos', 'delete:pagos',
    'edit:configuracion', 'manage:equipo', 'view:billing'
  ],
  ADMIN: [
    'view:all', 'create:alumnos', 'edit:alumnos', 'delete:alumnos',
    'create:clases', 'edit:clases', 'edit:clases:all', 'delete:clases',
    'create:pagos', 'edit:pagos', 'delete:pagos',
    'edit:configuracion', 'manage:equipo'
  ],
  INSTRUCTOR: [
    'view:all', 'create:alumnos', 'edit:alumnos',
    'create:clases', 'edit:clases', // Solo sus propias clases
  ],
  VIEWER: [
    'view:all'
  ]
} as const

type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS][number]

export function hasPermission(rol: EstudioRol, permission: Permission): boolean {
  const permisos = PERMISSIONS[rol]
  return permisos.includes(permission as never)
}

export function canEditClase(rol: EstudioRol, claseProfesorId: string, userId: string): boolean {
  if (rol === 'OWNER' || rol === 'ADMIN') return true
  if (rol === 'INSTRUCTOR') return claseProfesorId === userId
  return false
}
