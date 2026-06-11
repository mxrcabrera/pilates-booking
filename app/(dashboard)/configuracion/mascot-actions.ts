'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DEFAULT_MASCOT_RULES } from '@/lib/mascot'

export async function updateBuddyName(name: string) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  await prisma.user.update({
    where: { id: userId },
    data: { buddyName: name.trim() || 'Welfi' },
  })

  revalidateMascot()
  return { success: true }
}

export async function addMascotImage(url: string, label: string) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  const trimmedLabel = label.trim()
  if (!trimmedLabel) throw new Error('La etiqueta es obligatoria')

  const count = await prisma.mascotImage.count({ where: { userId } })

  const image = await prisma.mascotImage.create({
    data: {
      userId,
      url,
      label: trimmedLabel,
      isDefault: count === 0,
      sortOrder: count,
    },
  })

  if (count === 0) {
    await seedDefaultRulesIfEmpty(userId)
  }

  revalidateMascot()
  return image
}

export async function updateMascotImage(
  id: string,
  data: { label?: string; isDefault?: boolean }
) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  if (data.isDefault) {
    await prisma.mascotImage.updateMany({
      where: { userId },
      data: { isDefault: false },
    })
  }

  await prisma.mascotImage.update({
    where: { id, userId },
    data: {
      ...(data.label !== undefined ? { label: data.label.trim() } : {}),
      ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
    },
  })

  revalidateMascot()
  return { success: true }
}

export async function deleteMascotImage(id: string) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  const image = await prisma.mascotImage.findFirst({
    where: { id, userId },
  })
  if (!image) throw new Error('Imagen no encontrada')

  await prisma.mascotImage.delete({ where: { id } })

  if (image.isDefault) {
    const next = await prisma.mascotImage.findFirst({
      where: { userId },
      orderBy: { sortOrder: 'asc' },
    })
    if (next) {
      await prisma.mascotImage.update({
        where: { id: next.id },
        data: { isDefault: true },
      })
    }
  }

  revalidateMascot()
  return { success: true }
}

export async function saveMascotRules(
  rules: { context: string; tag: string; priority: number }[]
) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  await prisma.$transaction([
    prisma.mascotRule.deleteMany({ where: { userId } }),
    ...rules.map((rule) =>
      prisma.mascotRule.create({
        data: {
          userId,
          context: rule.context,
          tag: rule.tag.trim(),
          priority: rule.priority,
        },
      })
    ),
  ])

  revalidateMascot()
  return { success: true }
}

async function seedDefaultRulesIfEmpty(userId: string) {
  const count = await prisma.mascotRule.count({ where: { userId } })
  if (count > 0) return

  await prisma.mascotRule.createMany({
    data: DEFAULT_MASCOT_RULES.map((rule) => ({ userId, ...rule })),
  })
}

function revalidateMascot() {
  revalidatePath('/perfil')
  revalidatePath('/dashboard')
  revalidatePath('/calendario')
  revalidatePath('/alumnos')
  revalidatePath('/pagos')
  revalidatePath('/reportes')
  revalidatePath('/configuracion')
}
