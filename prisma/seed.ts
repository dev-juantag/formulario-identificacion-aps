import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

// Inicializa Supabase usando Service Role Key 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🌱 Iniciando seed SI-APS...')

  const email = process.env.SEED_EMAIL || 'juantaguado05@gmail.com'
  const password = process.env.SEED_PASSWORD || 'admin123'
  const documento = process.env.SEED_DOCUMENTO || '1004628559'

  console.log('Creando usuario en Supabase Auth...')
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError && !authError.message.includes('already registered')) {
    console.log('⚠️ Aviso desde Supabase Auth:', authError.message)
  } else {
    console.log(`✅ Credenciales configuradas en Supabase Auth: ${email}`)
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`✅ Super Admin ya existe en Prisma: ${email}`)
    return
  }

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      documento,
      nombre: 'Admin Original',
      apellidos: 'SI-APS',
      role: 'SUPER_ADMIN',
      active: true,
    }
  })

  console.log(`✅ Super Admin creado en Prisma: ${user.email} (ID: ${user.id})`)
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
