import { NextRequest } from 'next/server'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.1-8b-instant'

const SYSTEM_PROMPT = `You are a helpful assistant for the Pilates Booking system. You help both professors and students with questions about the platform.

IMPORTANT: Always respond in Spanish by default. If the user explicitly writes in English, switch to English.

Key information:
- Platform: Pilates Booking System
- Features: Class scheduling, student management, payment tracking, waitlist, notifications
- Roles: Profesor (instructor), Alumno (student)
- Plans: FREE (5 alumnos), STARTER (15 alumnos), PRO (50 alumnos), ESTUDIO (ilimitado)

Horarios:
- Each professor configures their own morning and afternoon schedules
- Morning shift: typically 8:00-14:00 (configurable)
- Afternoon shift: typically 17:00-22:00 (configurable)
- Professors can enable/disable each shift independently

Precios:
- Each professor defines their own prices per class
- Prices can be configured individually per student or use a base price
- Payment tracking is available in the platform

Política de cancelación:
- Students can cancel classes up to 1 hour before the scheduled time
- Late cancellations are considered as absence
- Cancellations free up the slot for other students

Lista de espera:
- Automatically managed when classes are full
- Students can join the waitlist when a class is full
- When a slot becomes available, the system notifies the first student on the waitlist

Planes:
- FREE: 5 alumnos, basic features
- STARTER: 15 alumnos, includes waitlist and email notifications
- PRO: 50 alumnos, includes Google Calendar sync, reports, and WhatsApp notifications
- ESTUDIO: Unlimited students, includes multiple users, roles, advanced reports, and priority support

Keep responses concise (2-4 sentences). Be friendly and professional. If asked something unrelated to the platform, politely redirect to the platform features.

FORMATTING: Never use markdown formatting in your responses. No bold (**), no italic (*), no headers (#), no bullet points (-), no code blocks. Write plain text only.`

const MAX_MESSAGE_LENGTH = 500
const MAX_MESSAGES = 20
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false
  }

  entry.count++
  return true
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'AI assistant is not configured.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please wait a moment.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    )
  }

  let body: { messages?: ChatMessage[], buddyName?: string }
  try {
    body = await request.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const { messages, buddyName = 'Welfi' } = body

  // Use buddyName in personalized system prompt
  console.log(`Using mascot name: ${buddyName}`)

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Messages array is required.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  if (messages.length > MAX_MESSAGES) {
    return new Response(
      JSON.stringify({ error: 'Conversation too long. Please start a new chat.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const lastMessage = messages[messages.length - 1]
  if (
    !lastMessage ||
    lastMessage.role !== 'user' ||
    typeof lastMessage.content !== 'string' ||
    lastMessage.content.length > MAX_MESSAGE_LENGTH
  ) {
    return new Response(
      JSON.stringify({ error: `Message must be under ${MAX_MESSAGE_LENGTH} characters.` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const sanitizedMessages: ChatMessage[] = messages
    .filter(
      (m): m is ChatMessage =>
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.length <= MAX_MESSAGE_LENGTH,
    )
    .map((m) => ({ role: m.role, content: m.content.trim() }))

  const groqMessages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...sanitizedMessages,
  ]

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: groqMessages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!groqRes.ok) {
      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const data = await groqRes.json()
    const text = data?.choices?.[0]?.message?.content ?? ''

    return new Response(
      JSON.stringify({ response: text }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch {
    return new Response(
      JSON.stringify({ error: 'AI service temporarily unavailable.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
