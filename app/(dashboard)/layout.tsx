import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardNav } from './dashboard/dashboard-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userId = await getCurrentUser()
  
  if (!userId) {
    redirect('/login')
  }

  // Obtener datos del usuario
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nombre: true,
      email: true,
    }
  })

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav profesor={user} />
      <main>
        {children}
      </main>
    </div>
  )
}