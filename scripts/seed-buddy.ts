import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function seed() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Faltan variables de entorno para Supabase (NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY).')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Create bucket if it doesn't exist
  const { data: buckets } = await supabase.storage.listBuckets()
  if (buckets && !buckets.some(b => b.name === 'avatars')) {
    console.log('Creando bucket "avatars"...')
    await supabase.storage.createBucket('avatars', { public: true })
  }

  const userEmail = 'pilateswelfare@gmail.com'

  const user = await prisma.user.findUnique({ where: { email: userEmail } })
  if (!user) {
    console.log(`Usuario ${userEmail} no encontrado, skip.`)
    return
  }

  const basePath = path.join(process.cwd(), 'public', 'welfi')
  const images = {
    greeting: 'welfi-peace.jpg',
    celebrate: 'welfi-celebrate.jpg',
    zen: 'welfi-zen.jpg'
  }

  const uploadedUrls: Record<string, string> = {}

  for (const [key, filename] of Object.entries(images)) {
    const filePath = path.join(basePath, filename)
    if (!fs.existsSync(filePath)) {
      console.log(`Archivo ${filename} no encontrado, omitiendo.`)
      continue
    }

    const fileBuffer = fs.readFileSync(filePath)
    const fileExt = path.extname(filename)
    const remoteName = `seed_welfi_${user.id}_${key}_${Date.now()}${fileExt}`

    console.log(`Subiendo ${filename}...`)
    const { error } = await supabase.storage
      .from('avatars')
      .upload(remoteName, fileBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error(`Error subiendo ${filename}:`, error.message)
      continue
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(remoteName)
    uploadedUrls[key] = publicUrl
  }

  if (Object.keys(uploadedUrls).length === 0) {
    console.log('No se subieron archivos.')
    return
  }

  console.log('Actualizando base de datos para pilateswelfare@gmail.com...')
  await prisma.user.update({
    where: { email: userEmail },
    data: {
      buddyGreetingUrl: uploadedUrls.greeting || null,
      buddyCelebrateUrl: uploadedUrls.celebrate || null,
      buddyZenUrl: uploadedUrls.zen || null,
    }
  })

  // Borrar archivos originales
  console.log('Borrando archivos locales /public/welfi...')
  for (const filename of Object.values(images)) {
    const filePath = path.join(basePath, filename)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }

  const dirPath = path.dirname(path.join(basePath, 'temp.jpg'))
  // Solo borra si la carpeta está vacía
  if (fs.existsSync(dirPath) && fs.readdirSync(dirPath).length === 0) {
    fs.rmdirSync(dirPath)
  }

  console.log('Seed de Mascotas completado.')
}

seed().catch(console.error).finally(() => prisma.$disconnect())
