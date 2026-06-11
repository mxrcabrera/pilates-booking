import { prisma } from '@/lib/prisma'
import { DEFAULT_MASCOT_RULES, type MascotConfig } from '@/lib/mascot'

export async function migrateLegacyBuddyUrls(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      buddyGreetingUrl: true,
      buddyCelebrateUrl: true,
      buddyZenUrl: true,
      mascotImages: { select: { id: true } },
    },
  })

  if (!user || user.mascotImages.length > 0) return

  const legacy: { label: string; url: string | null; isDefault?: boolean }[] = [
    { label: 'saludo', url: user.buddyGreetingUrl, isDefault: true },
    { label: 'celebracion', url: user.buddyCelebrateUrl },
    { label: 'zen', url: user.buddyZenUrl },
  ]

  const toCreate = legacy.filter((item) => item.url)
  if (toCreate.length === 0) return

  await prisma.$transaction([
    ...toCreate.map((item, index) =>
      prisma.mascotImage.create({
        data: {
          userId,
          url: item.url!,
          label: item.label,
          isDefault: item.isDefault ?? false,
          sortOrder: index,
        },
      })
    ),
    ...DEFAULT_MASCOT_RULES.map((rule) =>
      prisma.mascotRule.create({
        data: { userId, ...rule },
      })
    ),
  ])
}

export async function getMascotConfig(userId: string): Promise<MascotConfig> {
  await migrateLegacyBuddyUrls(userId)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      buddyName: true,
      mascotImages: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          url: true,
          label: true,
          isDefault: true,
          sortOrder: true,
        },
      },
      mascotRules: {
        orderBy: [{ priority: 'desc' }, { context: 'asc' }],
        select: {
          id: true,
          context: true,
          tag: true,
          priority: true,
        },
      },
    },
  })

  if (!user) {
    return { buddyName: 'Welfi', images: [], rules: [] }
  }

  return {
    buddyName: user.buddyName ?? 'Welfi',
    images: user.mascotImages,
    rules: user.mascotRules,
  }
}
