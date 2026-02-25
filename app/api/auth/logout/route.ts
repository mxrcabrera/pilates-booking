import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
  cookieStore.delete('next-auth.session-token')
  cookieStore.delete('next-auth.csrf-token')
  cookieStore.delete('next-auth.callback-url')
  cookieStore.delete('__Secure-next-auth.session-token')
  cookieStore.delete('__Secure-next-auth.csrf-token')
  cookieStore.delete('__Secure-next-auth.callback-url')
  return NextResponse.json({ success: true })
}
