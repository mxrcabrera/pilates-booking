import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardNav } from './dashboard/dashboard-nav'
import { unstable_cache } from 'next/cache'

// Cache user data for 5 minutes
const getCachedUser = unstable_cache(
  async (userId: string) => {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        email: true,
      }
    })
  },
  ['user-data'],
  { revalidate: 300 } // 5 minutes
)

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userId = await getCurrentUser()

  if (!userId) {
    redirect('/login')
  }

  const user = await getCachedUser(userId)

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav profesor={user} />
      <main>
        <Suspense>
          {children}
        </Suspense>
      </main>
    </div>
  )
}
