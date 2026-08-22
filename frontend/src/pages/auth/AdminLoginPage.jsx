import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react'
import { FormField } from '@/components/ui'

const schema = z.object({
  identifier: z.string().min(1, 'Enter your email or username'),
  password: z.string().min(1, 'Password is required'),
})

export default function AdminLoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ identifier, password }) => {
    try {
      const user = await login(identifier, password)
      if (user.role !== 'admin' && user.role !== 'teacher') {
        setError('root', { message: 'This login is for staff accounts only. Use Student Login instead.' })
        return
      }
      const from = location.state?.from?.pathname
      const redirects = { admin: '/admin', teacher: '/teacher' }
      navigate(from || redirects[user.role], { replace: true })
    } catch (err) {
      setError('root', { message: err.response?.data?.message || 'Invalid credentials' })
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-6 relative overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-[0.12] pointer-events-none" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1200 800">
        <circle cx="200" cy="650" r="260" fill="none" stroke="#D4A24C" strokeWidth="1" />
        <circle cx="200" cy="650" r="180" fill="none" stroke="#D4A24C" strokeWidth="1" />
      </svg>

      <div className="relative w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-gold-400/15 border border-gold-400/40 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-gold-300" />
          </div>
          <span className="font-display font-semibold text-chalk-100 text-lg">Vanita Math Classes</span>
        </Link>

        <div className="bg-ink-900 border border-chalk-100/10 rounded-2xl p-8">
          <h1 className="font-display text-xl text-chalk-100 font-medium">Staff sign in</h1>
          <p className="text-chalk-200/50 text-sm mt-1">For admin and faculty accounts only.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
            {errors.root && (
              <div className="bg-mark/10 border border-mark/30 text-mark text-sm px-4 py-3 rounded-lg">
                {errors.root.message}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-chalk-200/70 mb-1.5">Email or username</label>
              <input {...register('identifier')} type="text" placeholder="admin@vanitamath.com" className="w-full px-3 py-2.5 text-sm rounded-lg bg-ink-950 border border-chalk-100/15 text-chalk-100 placeholder:text-chalk-200/30 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400/50" autoFocus autoComplete="username" />
              {errors.identifier && <p className="text-mark text-xs mt-1">{errors.identifier.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-chalk-200/70 mb-1.5">Password</label>
              <div className="relative">
                <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="••••••••" className="w-full px-3 py-2.5 pr-10 text-sm rounded-lg bg-ink-950 border border-chalk-100/15 text-chalk-100 placeholder:text-chalk-200/30 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400/50" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-chalk-200/40 hover:text-chalk-200/70">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-mark text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm bg-gold-400 text-ink-950 hover:bg-gold-300 transition-colors disabled:opacity-50">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</> : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-chalk-200/40 mt-6">
          Student? <Link to="/login" className="text-gold-300 hover:text-gold-200 font-medium">Go to student login</Link>
        </p>
      </div>
    </div>
  )
}
