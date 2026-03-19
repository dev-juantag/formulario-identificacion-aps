import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('sb-access-token')?.value || req.cookies.get('session')?.value
  const { pathname } = req.nextUrl

  // Protected routes (Admin only)
  const isProtectedRoute = pathname.startsWith('/admin')
  const isAuthRoute = pathname === '/login'

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
