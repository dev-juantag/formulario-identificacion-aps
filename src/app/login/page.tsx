'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Input, Button, Label } from '@/components/ui-basic'
import { LogIn, ShieldAlert } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;

      // Set session cookie for middleware
      document.cookie = `session=${authData.session?.access_token}; path=/; max-age=3600; SameSite=Lax`
      
      router.push('/admin')
    } catch (err: any) {
      console.error(err)
      setError('Credenciales inválidas o error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#112d8a] via-[#051240] to-black px-4 relative overflow-hidden">
      
      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

      <div className="w-full max-w-sm space-y-8 relative z-10">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0a8c32] to-[#044c1a] text-white shadow-2xl shadow-emerald-900/50 mb-6 border border-emerald-400/20">
            <LogIn size={28} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
            ADMINISTRACIÓN SI-APS
          </h1>
          <p className="mt-2 text-sm font-medium text-blue-200/60 leading-relaxed max-w-[250px] mx-auto">
            Sistema para control interno de las identificaciones
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            
            {/* Inner glass highlight */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="space-y-5 relative z-10">
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-blue-100/90 text-[11px] font-bold tracking-widest uppercase">Correo Electrónico</Label>
                <input
                  id="email"
                  type="email"
                  placeholder="ejemplo@ese.gov.co"
                  {...register('email')}
                  className={`w-full h-12 rounded-xl bg-black/20 border text-white placeholder:text-blue-200/30 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${errors.email ? 'border-red-500/50' : 'border-white/10'}`}
                />
                {errors.email && (
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-wide mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="password" className="text-blue-100/90 text-[11px] font-bold tracking-widest uppercase">Contraseña</Label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full h-12 rounded-xl bg-black/20 border text-white placeholder:text-blue-200/30 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${errors.password ? 'border-red-500/50' : 'border-white/10'}`}
                />
                {errors.password && (
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-wide mt-1">{errors.password.message}</p>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-5 relative z-10 flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-[13px] text-red-200 font-semibold backdrop-blur-sm">
                <ShieldAlert size={18} className="text-red-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 relative z-10 w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 flex items-center justify-center text-white text-[15px] font-black tracking-wide shadow-xl shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Identificando...' : 'Autenticar'}
            </button>
          </div>
        </form>
        
        <p className="text-center text-[10px] text-blue-300/30 uppercase tracking-[0.2em] font-black pb-10">
          © 2026 | Desarrollado por Juan Taguado para APS Pereira
        </p>
      </div>
    </div>
  )
}
