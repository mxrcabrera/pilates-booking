'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { removeAuthCookie } from '@/lib/auth'
import { signIn } from '@/lib/auth'

export async function logout() {
  await removeAuthCookie()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function loginWithGoogle() {
  await signIn('google', { redirectTo: '/dashboard' })
}
