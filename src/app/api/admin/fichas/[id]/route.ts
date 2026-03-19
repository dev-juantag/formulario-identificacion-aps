import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

  // EXCLUSIVAMENTE SUPER_ADMIN permite hacer purgas
  if (!dbUser || dbUser.role !== 'SUPER_ADMIN') {
    return null
  }
  return dbUser
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const superAdmin = await getSuperAdminUser(req)
  if (!superAdmin) {
    return NextResponse.json({ error: 'Acceso Denegado: Solo el SUPER_ADMIN puede eliminar registros' }, { status: 403 })
  }

  try {
    const targetFicha = await prisma.fichaHogar.findUnique({ where: { id: resolvedParams.id } })
    if (!targetFicha) {
      return NextResponse.json({ error: 'Ficha de Identificación no encontrada' }, { status: 404 })
    }

    // Ejecuta Delete (Activará OnDelete Cascade sobre "Integrantes" automáticamente en base de datos)
    await prisma.fichaHogar.delete({ where: { id: resolvedParams.id } })

    return NextResponse.json({ message: 'Registro de Identificación eliminado permanentemente' }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al eliminar ficha' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const superAdmin = await getSuperAdminUser(req)
  if (!superAdmin) {
    return NextResponse.json({ error: 'Acceso Denegado: Solo el SUPER_ADMIN puede editar registros' }, { status: 403 })
  }

  try {
    const data = await req.json()
    const { estadoVisita, direccion, centroPoblado, descripcionUbicacion, estratoSocial, numEBS, numHogar } = data

    const targetFicha = await prisma.fichaHogar.findUnique({ where: { id: resolvedParams.id } })
    if (!targetFicha) {
      return NextResponse.json({ error: 'Ficha de Identificación no encontrada' }, { status: 404 })
    }

    const un = undefined;
    const updated = await prisma.fichaHogar.update({
      where: { id: resolvedParams.id },
      data: {
        estadoVisita: estadoVisita !== undefined ? String(estadoVisita) : un,
        direccion: direccion !== undefined ? String(direccion) : un,
        // @ts-ignore
        centroPoblado: centroPoblado ?? un,
        // @ts-ignore
        descripcionUbicacion: descripcionUbicacion ?? un,
        estratoSocial: estratoSocial !== null && estratoSocial !== '' && estratoSocial !== undefined ? Number(estratoSocial) : un,
        numEBS: numEBS !== undefined ? String(numEBS) : un,
        numHogar: numHogar !== undefined ? String(numHogar) : un
      }
    })

    return NextResponse.json({ message: 'Registro actualizado correctamente', ficha: updated }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al editar ficha' }, { status: 500 })
  }
}
