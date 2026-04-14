import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import prisma from '@/lib/prisma'



// Helper restricted explicitly to SUPER_ADMIN
async function getSuperAdminUser(req: Request) {
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

  if (!dbUser || dbUser.role !== 'SUPER_ADMIN') {
    return null
  }
  return dbUser
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const superAdmin = await getSuperAdminUser(req)
  if (!superAdmin) {
    return NextResponse.json({ error: 'Acceso Denegado: Solo el SUPER_ADMIN puede editar usuarios' }, { status: 403 })
  }

  try {
    const data = await req.json()
    const { nombre, apellidos, documento, role } = data

    const targetUser = await prisma.user.findUnique({ where: { id: resolvedParams.id } })
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario a editar no encontrado' }, { status: 404 })
    }

    if (targetUser.id === superAdmin.id && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'El Super Admin no puede degradar su propio rol' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: resolvedParams.id },
      data: {
        nombre,
        apellidos,
        documento,
        role
      }
    })

    return NextResponse.json(updatedUser, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al editar el usuario' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const superAdmin = await getSuperAdminUser(req)
  if (!superAdmin) {
    return NextResponse.json({ error: 'Acceso Denegado: Solo el SUPER_ADMIN puede eliminar usuarios' }, { status: 403 })
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: resolvedParams.id } })
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    if (targetUser.id === superAdmin.id) {
      return NextResponse.json({ error: 'No puedes auto-eliminarte del sistema' }, { status: 400 })
    }

    // Attempt to delete from Auth if we can find them by iterating (Supabase admin constraints)
    // We will ensure at minimum the Prisma local row that controls RBAC is purged.
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
      
      // Attempt to locate Auth User by email to hard-delete
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
      if (listData && listData.users) {
        const authMapping = listData.users.find(u => u.email === targetUser.email)
        if (authMapping) {
          await supabaseAdmin.auth.admin.deleteUser(authMapping.id)
        }
      }
    }

    // Delete Prisma Row (Revokes RBAC / Local Authority entirely)
    await prisma.user.delete({ where: { id: resolvedParams.id } })

    return NextResponse.json({ message: 'Usuario y credenciales eliminadas exitosamente' }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al eliminar usuario' }, { status: 500 })
  }
}
