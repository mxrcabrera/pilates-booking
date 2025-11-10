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

  // Obtener datos de la profesora
  const profesora = await prisma.profesora.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nombre: true,
      email: true,
    }
  })

  if (!profesora) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav profesora={profesora} />
      <main className="container mx-auto py-6 px-4">
        {children}
      </main>
    </div>
  )
}