import { NextResponse } from 'next/server'

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
  console.error('Server error:', error)
  const message = error instanceof Error ? error.message : 'Error interno del servidor'
  return NextResponse.json({ error: message }, { status: 500 })
}

