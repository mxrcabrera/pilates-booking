import { hasPermission, canEditClase } from '@/lib/auth/permissions'

describe('hasPermission', () => {
  it('OWNER has all permissions', () => {
    expect(hasPermission('OWNER', 'view:all')).toBe(true)
    expect(hasPermission('OWNER', 'manage:equipo')).toBe(true)
    expect(hasPermission('OWNER', 'view:billing')).toBe(true)
  })

  it('ADMIN has all permissions except billing', () => {
    expect(hasPermission('ADMIN', 'view:all')).toBe(true)
    expect(hasPermission('ADMIN', 'manage:equipo')).toBe(true)
    expect(hasPermission('ADMIN', 'view:billing')).toBe(false)
  })

  it('INSTRUCTOR can only view and manage own classes/students', () => {
    expect(hasPermission('INSTRUCTOR', 'view:all')).toBe(true)
    expect(hasPermission('INSTRUCTOR', 'create:clases')).toBe(true)
    expect(hasPermission('INSTRUCTOR', 'edit:clases')).toBe(true)
    expect(hasPermission('INSTRUCTOR', 'delete:clases')).toBe(false)
    expect(hasPermission('INSTRUCTOR', 'manage:equipo')).toBe(false)
    expect(hasPermission('INSTRUCTOR', 'edit:configuracion')).toBe(false)
  })

  it('VIEWER can only view', () => {
    expect(hasPermission('VIEWER', 'view:all')).toBe(true)
    expect(hasPermission('VIEWER', 'create:alumnos')).toBe(false)
    expect(hasPermission('VIEWER', 'edit:clases')).toBe(false)
  })
})

describe('canEditClase', () => {
  it('OWNER can edit any class', () => {
    expect(canEditClase('OWNER', 'profesor-1', 'profesor-2')).toBe(true)
  })

  it('ADMIN can edit any class', () => {
    expect(canEditClase('ADMIN', 'profesor-1', 'profesor-2')).toBe(true)
  })

  it('INSTRUCTOR can only edit own classes', () => {
    expect(canEditClase('INSTRUCTOR', 'profesor-1', 'profesor-1')).toBe(true)
    expect(canEditClase('INSTRUCTOR', 'profesor-1', 'profesor-2')).toBe(false)
  })

  it('VIEWER cannot edit any class', () => {
    expect(canEditClase('VIEWER', 'profesor-1', 'profesor-1')).toBe(false)
  })
})
