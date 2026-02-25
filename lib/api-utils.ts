/**
 * API Response Conventions:
 * - Success with entity: { success: true, [entity]: {...} }
 * - Success with list: { ...pagination, [entities]: [...] }
 * - Success action: { success: true }
 * - Error: { error: "message" } with appropriate HTTP status
 * - Creates return 201, deletes return 200, updates return 200
 */
import { NextResponse } from 'next/server'
import { logger } from './logger'

export function unauthorized() {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 })
}

export function notFound(message = 'No encontrado') {
  return NextResponse.json({ error: message }, { status: 404 })
}

export function forbidden(message = 'No tienes permiso') {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function tooManyRequests(retryAfter = 60) {
  return NextResponse.json(
    { error: 'Demasiadas solicitudes' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  )
}

export function serverError(error: unknown) {
  // Log full error for debugging (server-side only)
  logger.error('Server error:', error)
  // Never expose internal error details to client
  return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
}

