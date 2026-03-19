import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

// Internal Helper for RBAC Context Checking
async function getAdminUser(req: Request) {
  const authHeader = req.headers.get('Authorization')
  const cookieHeader = req.headers.get('cookie')
  let token = ''

  if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1]
  else if (cookieHeader) {
    const match = cookieHeader.match(/session=([^;]+)/)
    if (match) token = match[1]
  }

  if (!token) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user || !user.email) return null

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true, email: true, role: true }
  })

  if (!dbUser || (dbUser.role !== 'SUPER_ADMIN' && dbUser.role !== 'ADMIN')) {
    return null
  }
  return dbUser
}

export async function GET(req: Request) {
  const adminUser = await getAdminUser(req)
  if (!adminUser) return NextResponse.json({ error: 'Acceso Denegado' }, { status: 401 })

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        documento: true,
        nombre: true,
        apellidos: true,
        role: true,
        active: true,
        createdAt: true,
        lastLogin: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(users)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const adminUser = await getAdminUser(req)
  if (!adminUser) return NextResponse.json({ error: 'Acceso Denegado' }, { status: 401 })

  try {
    const body = await req.json()
    const { email, password, documento, nombre, apellidos, role } = body

    if (!email || !password || !documento || !role) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    // Role Hierarchy Protection
    if (adminUser.role === 'ADMIN' && role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Privilegios insuficientes para crear un SUPER_ADMIN' }, { status: 403 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Falta la SUPABASE_SERVICE_ROLE_KEY en el backend' }, { status: 500 })
    }

    // Initialize Supabase Admin Client using the Service Role Key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Check duplicate email or document locally first for faster rejection
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { documento }] }
    })
    
    if (existingUser) {
      return NextResponse.json({ error: 'El email o documento ya está en uso' }, { status: 400 })
    }

    // 1. Silent Administrative Supabase Auth Registration
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) throw new Error(authError.message)

    // 2. Encrypt Key and Clone Schema securely into local PostgreSQL
    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        documento,
        nombre: nombre || null,
        apellidos: apellidos || null,
        role,
        active: true
      },
      select: {
        id: true,
        email: true,
        documento: true,
        nombre: true,
        apellidos: true,
        role: true,
        active: true,
        createdAt: true
      }
    })

    return NextResponse.json({ message: 'Usuario creado exitosamente', user: newUser }, { status: 201 })
  } catch (err: any) {
    console.error('Error POST /api/admin/users:', err.message)
    return NextResponse.json({ error: err.message || 'Error interno al crear usuario' }, { status: 500 })
  }
}
