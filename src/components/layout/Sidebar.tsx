'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  ClipboardList,
  X,
  Menu,
  ChevronRight,
  Lock,
  HeartPulse,
  LayoutDashboard,
  UserCog,
  Database,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'

const PUBLIC_NAV = [
  { href: '/', label: 'Identificación', icon: ClipboardList },
]

export function Sidebar() {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [isAuth, setIsAuth] = useState<boolean | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  const checkAuth = async () => {
    try {
      const res = await fetch(`/api/auth/me?t=${Date.now()}`, { cache: 'no-store' })
      const data = await res.json()
      setIsAuth(data.authenticated)
      setRole(data.role)
    } catch {
      setIsAuth(false)
      setRole(null)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    document.cookie = 'session=; path=/; max-age=0'
    setIsAuth(false)
    setRole(null)
    router.push('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0a8c32, #065c21)' }}
          >
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-black text-white text-sm tracking-tight leading-none">
              SI-APS V3
            </p>
            <p className="text-[10px] text-blue-200/60 mt-0.5 leading-none">
              Identificación Poblacional
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {PUBLIC_NAV.map((item) => {
          const Icon = item.icon
          const active =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                active
                  ? 'text-white shadow-lg'
                  : 'text-blue-200/70 hover:bg-white/5 hover:text-white'
              )}
              style={
                active
                  ? { background: 'linear-gradient(135deg, #0a8c32cc, #0a8c3299)' }
                  : {}
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
              {active && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          )
        })}

        {isAuth && (role === 'SUPER_ADMIN' || role === 'ADMIN') && (
          <>
            <div className="mt-6 mb-2 px-4 text-[10px] font-black tracking-widest text-blue-200/30 uppercase">
              Administración
            </div>
            
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                pathname === '/admin' ? 'text-white shadow-lg' : 'text-blue-200/70 hover:bg-white/5 hover:text-white'
              )}
              style={pathname === '/admin' ? { background: 'linear-gradient(135deg, #0a8c32cc, #0a8c3299)' } : {}}
            >
              <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
              <span>Dashboard</span>
              {pathname === '/admin' && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>

            <Link
              href="/admin/usuarios"
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                pathname === '/admin/usuarios' ? 'text-white shadow-lg' : 'text-blue-200/70 hover:bg-white/5 hover:text-white'
              )}
              style={pathname === '/admin/usuarios' ? { background: 'linear-gradient(135deg, #0a8c32cc, #0a8c3299)' } : {}}
            >
              <UserCog className="w-5 h-5 flex-shrink-0" />
              <span>Añadir Usuario</span>
              {pathname === '/admin/usuarios' && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
            
            <Link
              href="/admin/fichas"
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                pathname === '/admin/fichas' ? 'text-white shadow-lg' : 'text-blue-200/70 hover:bg-white/5 hover:text-white'
              )}
              style={pathname === '/admin/fichas' ? { background: 'linear-gradient(135deg, #0a8c32cc, #0a8c3299)' } : {}}
            >
              <Database className="w-5 h-5 flex-shrink-0" />
              <span>Base Fichas</span>
              {pathname === '/admin/fichas' && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          </>
        )}
      </nav>

      {/* Login / Auth Footer */}
      <div className="px-3 py-4 border-t border-white/10">
        {isAuth === false ? (
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-blue-200/50 hover:text-white hover:bg-white/5 transition-all"
          >
            <Lock className="w-4 h-4 flex-shrink-0" />
            <span>Login Staff</span>
          </Link>
        ) : isAuth === true ? (
          <button
            onClick={() => { setOpen(false); handleLogout(); }}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-xs font-semibold text-red-300/60 hover:text-red-300 hover:bg-red-500/10 transition-all text-left"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        ) : (
          <div className="px-4 py-3 text-xs text-blue-200/30">Cargando...</div>
        )}
      </div>
    </div>
  )

  const sidebarBg = '#081e69'

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-3 right-3 z-[60] text-white p-2 rounded-lg shadow-lg"
        style={{ backgroundColor: sidebarBg }}
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'lg:hidden fixed top-0 left-0 z-50 h-full w-64 shadow-2xl transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ backgroundColor: sidebarBg }}
      >
        <SidebarContent />
      </aside>

      {/* Desktop fixed sidebar */}
      <aside
        className="hidden lg:flex flex-col fixed top-0 left-0 h-full w-64 shadow-2xl z-40"
        style={{ backgroundColor: sidebarBg }}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
