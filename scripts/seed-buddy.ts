import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { DEFAULT_MASCOT_RULES } from '../lib/mascot'

dotenv.config()

const prisma = new PrismaClient()

async function seed() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Faltan variables de entorno para Supabase.')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: buckets } = await supabase.storage.listBuckets()
  if (buckets && !buckets.some((b) => b.name === 'avatars')) {
    console.log('Creando bucket "avatars"...')
    await supabase.storage.createBucket('avatars', { public: true })
  }

  const userEmail = 'pilateswelfare@gmail.com'
  const user = await prisma.user.findUnique({ where: { email: userEmail } })
  if (!user) {
    console.log(`Usuario ${userEmail} no encontrado, skip.`)
    return
  }

  const existing = await prisma.mascotImage.count({ where: { userId: user.id } })
  if (existing > 0) {
    console.log('Ya hay imágenes de mascota, skip.')
    return
  }

  const basePath = path.join(process.cwd(), 'public', 'welfi')
  const imageDefs = [
    { label: 'saludo', baseName: 'welfi-peace', isDefault: true },
    { label: 'celebracion', baseName: 'welfi-celebrate' },
    { label: 'zen', baseName: 'welfi-zen' },
    { label: 'estirando', baseName: 'welfi-stretch' },
    { label: 'peace', baseName: 'welfi-peace-sign' },
    { label: 'saltando', baseName: 'welfi-jump' },
  ]

  let sortOrder = 0
  for (const def of imageDefs) {
    let filename = `${def.baseName}.png`
    let filePath = path.join(basePath, filename)

    if (!fs.existsSync(filePath)) {
      filename = `${def.baseName}.jpg`
      filePath = path.join(basePath, filename)
    }

    if (!fs.existsSync(filePath)) {
      console.log(`Archivo para ${def.baseName} no encontrado, omitiendo.`)
      continue
    }

    const fileBuffer = fs.readFileSync(filePath)
    const fileExt = path.extname(filename).toLowerCase()
    const contentType = fileExt === '.png' ? 'image/png' : 'image/jpeg'
    const remoteName = `seed_welfi_${user.id}_${def.label}_${Date.now()}${fileExt}`

    console.log(`Subiendo ${filename} como "${def.label}"...`)
    const { error } = await supabase.storage.from('avatars').upload(remoteName, fileBuffer, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    })

    if (error) {
      console.error(`Error subiendo ${filename}:`, error.message)
      continue
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(remoteName)

    await prisma.mascotImage.create({
      data: {
        userId: user.id,
        url: publicUrl,
        label: def.label,
        isDefault: def.isDefault ?? false,
        sortOrder: sortOrder++,
      },
    })
  }

  const ruleCount = await prisma.mascotRule.count({ where: { userId: user.id } })
  if (ruleCount === 0) {
    await prisma.mascotRule.createMany({
      data: DEFAULT_MASCOT_RULES.map((rule) => ({ userId: user.id, ...rule })),
    })
  }

  console.log('Seed de mascota completado.')
}

seed().catch(console.error).finally(() => prisma.$disconnect())
