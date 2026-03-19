import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const territorio = searchParams.get('territorio')
    const cedula = searchParams.get('cedula')

    if (!territorio) {
      return NextResponse.json({ error: 'Territorio requerido' }, { status: 400 })
    }

    const fichas = await prisma.fichaHogar.findMany({
      where: {
        territorio,
        ...(cedula ? {
          integrantes: {
            some: { numDoc: { contains: cedula } }
          }
        } : {})
      },
      include: {
        integrantes: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    return NextResponse.json({ fichas })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
