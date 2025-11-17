import { google } from 'googleapis'
import { prisma } from './prisma'

const CALENDAR_ID = 'primary'

/**
 * Refresh the Google OAuth access token using the refresh token
 */
async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  })

  const { credentials } = await oauth2Client.refreshAccessToken()
  return credentials.access_token
}

/**
 * Get authenticated Google Calendar client
 */
async function getCalendarClient(accessToken: string, refreshToken?: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  return google.calendar({ version: 'v3', auth: oauth2Client })
}

/**
 * Create a Google Calendar event for a class
 */
export async function createCalendarEvent(
  claseId: string,
  accessToken: string,
  refreshToken?: string
) {
  try {
    const clase = await prisma.clase.findUnique({
      where: { id: claseId },
      include: {
        alumno: {
          select: { nombre: true, email: true },
        },
        profesor: {
          select: { nombre: true },
        },
      },
    })

    if (!clase) {
      throw new Error('Clase no encontrada')
    }

    const calendar = await getCalendarClient(accessToken, refreshToken)

    // Combinar fecha + hora para crear el timestamp
    const [hora, minutos] = clase.horaInicio.split(':')
    const startDate = new Date(clase.fecha)
    startDate.setHours(parseInt(hora), parseInt(minutos), 0, 0)

    // Duración por defecto: 1 hora
    const endDate = new Date(startDate)
    endDate.setHours(startDate.getHours() + 1)

    const event = {
      summary: `Clase de Pilates${clase.alumno ? ` - ${clase.alumno.nombre}` : ''}`,
      description: clase.alumno
        ? `Clase de Pilates con ${clase.profesor.nombre}`
        : 'Clase de Pilates disponible',
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'America/Argentina/Buenos_Aires',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'America/Argentina/Buenos_Aires',
      },
      attendees: clase.alumno
        ? [{ email: clase.alumno.email }]
        : undefined,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 día antes
          { method: 'popup', minutes: 60 }, // 1 hora antes
        ],
      },
    }

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: event,
    })

    return response.data.id
  } catch (error: any) {
    // Si el token expiró, intentar refrescar
    if (error.code === 401 && refreshToken) {
      const newAccessToken = await refreshAccessToken(refreshToken)
      return createCalendarEvent(claseId, newAccessToken!, refreshToken)
    }
    throw error
  }
}

/**
 * Update an existing Google Calendar event
 */
export async function updateCalendarEvent(
  claseId: string,
  eventId: string,
  accessToken: string,
  refreshToken?: string
) {
  try {
    const clase = await prisma.clase.findUnique({
      where: { id: claseId },
      include: {
        alumno: {
          select: { nombre: true, email: true },
        },
        profesor: {
          select: { nombre: true },
        },
      },
    })

    if (!clase) {
      throw new Error('Clase no encontrada')
    }

    const calendar = await getCalendarClient(accessToken, refreshToken)

    const [hora, minutos] = clase.horaInicio.split(':')
    const startDate = new Date(clase.fecha)
    startDate.setHours(parseInt(hora), parseInt(minutos), 0, 0)

    const endDate = new Date(startDate)
    endDate.setHours(startDate.getHours() + 1)

    const event = {
      summary: `Clase de Pilates${clase.alumno ? ` - ${clase.alumno.nombre}` : ''}`,
      description: clase.alumno
        ? `Clase de Pilates con ${clase.profesor.nombre}`
        : 'Clase de Pilates disponible',
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'America/Argentina/Buenos_Aires',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'America/Argentina/Buenos_Aires',
      },
      attendees: clase.alumno
        ? [{ email: clase.alumno.email }]
        : undefined,
    }

    await calendar.events.update({
      calendarId: CALENDAR_ID,
      eventId: eventId,
      requestBody: event,
      sendUpdates: 'all', // Envía invitaciones a todos los attendees nuevos
    })

    return eventId
  } catch (error: any) {
    if (error.code === 401 && refreshToken) {
      const newAccessToken = await refreshAccessToken(refreshToken)
      return updateCalendarEvent(claseId, eventId, newAccessToken!, refreshToken)
    }
    throw error
  }
}

/**
 * Delete a Google Calendar event
 */
export async function deleteCalendarEvent(
  eventId: string,
  accessToken: string,
  refreshToken?: string
) {
  try {
    const calendar = await getCalendarClient(accessToken, refreshToken)

    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId: eventId,
    })
  } catch (error: any) {
    if (error.code === 401 && refreshToken) {
      const newAccessToken = await refreshAccessToken(refreshToken)
      return deleteCalendarEvent(eventId, newAccessToken!, refreshToken)
    }
    throw error
  }
}
