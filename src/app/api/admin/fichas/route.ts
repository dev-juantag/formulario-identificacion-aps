import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import prisma from '@/lib/prisma'


export const dynamic = 'force-dynamic'

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

  // Permite tanto ADMIN como SUPER_ADMIN ingresar para Leer y Exportar
  if (!dbUser || (dbUser.role !== 'SUPER_ADMIN' && dbUser.role !== 'ADMIN')) {
    return null
  }
  return dbUser
}

export async function GET(req: Request) {
  const adminUser = await getAdminUser(req)
  if (!adminUser) return NextResponse.json({ error: 'Acceso Denegado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const qHogar = searchParams.get('hogar')
  const qFamilia = searchParams.get('familia')
  const qCreador = searchParams.get('creador')
  const qEstado = searchParams.get('estado')

  const whereOptions: any = {}

  if (qEstado) {
    whereOptions.estadoVisita = qEstado
  }
  if (qHogar) {
    whereOptions.numHogar = { contains: qHogar }
  }
  if (qFamilia) {
    whereOptions.numFamilia = { contains: qFamilia }
  }
  if (qCreador) {
    whereOptions.OR = [
      { encuestador: { documento: { contains: qCreador } } },
      { numDocEncuestador: { contains: qCreador } }
    ]
  }

  try {
    const fichas = await prisma.fichaHogar.findMany({
      where: whereOptions,
      select: {
         id: true,
         consecutivo: true,
         estadoVisita: true,
         observacionesRechazo: true,
         direccion: true,
         // @ts-ignore - Supress outdated local TS cache
         centroPoblado: true,
         descripcionUbicacion: true,
         estratoSocial: true,
         numEBS: true,
         numHogar: true,
         territorio: true,
         microterritorio: true,
         fechaDiligenciamiento: true,
         encuestador: {
             select: { nombre: true, apellidos: true, documento: true }
         },
         numDocEncuestador: true,
         // Conteo para mostrar la escala
         _count: {
             select: { integrantes: true }
         }
      },
      orderBy: { consecutivo: 'desc' }
    })
    return NextResponse.json(fichas)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
