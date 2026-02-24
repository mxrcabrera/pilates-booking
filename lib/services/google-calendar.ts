import { prisma } from '../prisma'
import { logger } from '../logger'
import { fetchWithRetry } from '../fetch-retry'

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3'

interface CalendarEvent {
  id?: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
}

async function getAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: 'google' },
    select: { access_token: true, refresh_token: true, expires_at: true },
  })

  if (!account?.access_token) return null

  // Check if token is expired
  if (account.expires_at && account.expires_at * 1000 < Date.now()) {
    // Token expired, try to refresh
    if (account.refresh_token) {
      const newToken = await refreshAccessToken(userId, account.refresh_token)
      return newToken
    }
    return null
  }

  return account.access_token
}

async function refreshAccessToken(userId: string, refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    const data = await response.json()

    if (data.access_token) {
      await prisma.account.updateMany({
        where: { userId, provider: 'google' },
        data: {
          access_token: data.access_token,
          expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
        },
      })
      return data.access_token
    }

    return null
  } catch (error) {
    logger.error('Error refreshing Google token', error)
    return null
  }
}

export async function createCalendarEvent(
  userId: string,
  claseId: string,
  alumnoNombre: string,
  fecha: Date,
  horaInicio: string
): Promise<string | null> {
  const accessToken = await getAccessToken(userId)
  if (!accessToken) {
    logger.warn('No access token for Google Calendar', { userId })
    return null
  }

  const [hours, minutes] = horaInicio.split(':').map(Number)
  const startDate = new Date(fecha)
  startDate.setHours(hours, minutes, 0, 0)
  const endDate = new Date(startDate)
  endDate.setHours(endDate.getHours() + 1)

  const event: CalendarEvent = {
    summary: `Clase de Pilates - ${alumnoNombre}`,
    description: `Clase con ${alumnoNombre}`,
    start: {
      dateTime: startDate.toISOString(),
      timeZone: 'America/Argentina/Buenos_Aires',
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: 'America/Argentina/Buenos_Aires',
    },
  }

  try {
    const response = await fetchWithRetry(`${CALENDAR_API_BASE}/calendars/primary/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }, 'Google Calendar create')

    if (!response.ok) {
      const error = await response.text()
      logger.error('Error creating calendar event', { error })
      return null
    }

    const createdEvent = await response.json()

    // Save event ID to clase
    await prisma.clase.update({
      where: { id: claseId },
      data: { googleEventId: createdEvent.id },
    })

    logger.info('Calendar event created', { claseId, eventId: createdEvent.id })
    return createdEvent.id
  } catch (error) {
    logger.error('Error creating calendar event', error)
    return null
  }
}

export async function updateCalendarEvent(
  userId: string,
  eventId: string,
  alumnoNombre: string,
  fecha: Date,
  horaInicio: string
): Promise<boolean> {
  const accessToken = await getAccessToken(userId)
  if (!accessToken) return false

  const [hours, minutes] = horaInicio.split(':').map(Number)
  const startDate = new Date(fecha)
  startDate.setHours(hours, minutes, 0, 0)
  const endDate = new Date(startDate)
  endDate.setHours(endDate.getHours() + 1)

  const event: CalendarEvent = {
    summary: `Clase de Pilates - ${alumnoNombre}`,
    description: `Clase con ${alumnoNombre}`,
    start: {
      dateTime: startDate.toISOString(),
      timeZone: 'America/Argentina/Buenos_Aires',
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: 'America/Argentina/Buenos_Aires',
    },
  }

  try {
    const response = await fetchWithRetry(`${CALENDAR_API_BASE}/calendars/primary/events/${eventId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }, 'Google Calendar update')

    return response.ok
  } catch (error) {
    logger.error('Error updating calendar event', error)
    return false
  }
}

export async function deleteCalendarEvent(userId: string, eventId: string): Promise<boolean> {
  const accessToken = await getAccessToken(userId)
  if (!accessToken) return false

  try {
    const response = await fetchWithRetry(`${CALENDAR_API_BASE}/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }, 'Google Calendar delete')

    return response.ok || response.status === 404
  } catch (error) {
    logger.error('Error deleting calendar event', error)
    return false
  }
}
