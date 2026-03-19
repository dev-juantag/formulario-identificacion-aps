import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const defaultRes = { authenticated: false, role: null, user: null }

    const authHeader = req.headers.get('Authorization')
    const cookieHeader = req.headers.get('cookie')
    let token = ''

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    } else if (cookieHeader) {
      const match = cookieHeader.match(/session=([^;]+)/)
      if (match) token = match[1]
    }

    if (!token) {
      return NextResponse.json(defaultRes)
    }

    // Verify token directly with Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user || !user.email) {
      return NextResponse.json(defaultRes)
    }

    // Lookup matching role in Prisma using the exact email
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellidos: true,
        role: true,
      }
    })

    if (!dbUser) {
      return NextResponse.json(defaultRes)
    }

    return NextResponse.json({
      authenticated: true,
      role: dbUser.role,
      user: dbUser
    })
  } catch (error: any) {
    console.error('Error /auth/me:', error)
    return NextResponse.json({ authenticated: false, role: null, user: null }, { status: 500 })
  }
}
