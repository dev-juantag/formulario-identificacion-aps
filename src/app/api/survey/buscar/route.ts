import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const territorio = searchParams.get('territorio')
    const cedula = searchParams.get('cedula')
    const estado = searchParams.get('estado')

    if (!territorio) {
      return NextResponse.json({ error: 'Territorio requerido' }, { status: 400 })
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = 50
    const skip = (page - 1) * limit

    const whereObj: any = { territorio }
    if (estado) whereObj.estadoVisita = estado
    if (cedula) {
      whereObj.OR = [
        { numDocEncuestador: { contains: cedula } },
        { encuestador: { documento: { contains: cedula } } }
      ]
    }

    const [fichas, total] = await Promise.all([
      prisma.fichaHogar.findMany({
        where: whereObj,
        include: {
          integrantes: true,
          encuestador: {
            select: { nombre: true, apellidos: true, documento: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip,
      }),
      prisma.fichaHogar.count({ where: whereObj })
    ])

    return NextResponse.json({ fichas, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
