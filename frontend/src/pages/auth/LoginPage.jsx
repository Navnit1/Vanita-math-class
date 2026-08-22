import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react'
import { FormField } from '@/components/ui'

const schema = z.object({
  identifier: z.string().min(1, 'Enter your email, username, or Student ID'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
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
      const from = location.state?.from?.pathname
      const redirects = { admin: '/admin', teacher: '/teacher', student: '/dashboard' }
      navigate(from || redirects[user.role] || '/dashboard', { replace: true })
    } catch (err) {
      setError('root', { message: err.response?.data?.message || 'Invalid credentials' })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-600 flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-3 w-fit">
          <img src="/fab2.jpeg" alt="Vanita Math Classes logo" className="w-10 h-10 rounded-lg object-contain bg-white p-1 flex-shrink-0" />
<span className="font-display font-semibold text-white text-lg">Vanita Math Classes</span>
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            The smarter way to manage your coaching institute
          </h2>
          <p className="text-primary-200 text-base leading-relaxed">
            Track fees, attendance, and performance — all in one place. Designed for teachers, students, and administrators.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6">
            {[['Students', 'Track progress & fees'], ['Attendance', 'Daily batch reports'], ['Payments', 'Offline receipt tracking']].map(([t, s]) => (
              <div key={t} className="bg-white/10 rounded-xl p-4">
                <p className="text-white font-semibold text-sm">{t}</p>
                <p className="text-primary-200 text-xs mt-1">{s}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-primary-300 text-sm">&copy; 2026 Vanita Math Classes. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 lg:hidden mb-8">
            <GraduationCap className="w-7 h-7 text-primary-600" />
            <span className="font-bold text-slate-900 text-lg">Vanita Math Classes</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
            <p className="text-slate-500 text-sm mt-1">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            {errors.root && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {errors.root.message}
              </div>
            )}

            <FormField label="Email, username, or Student ID" error={errors.identifier?.message} required>
              <input {...register('identifier')} type="text" placeholder="you@example.com / yourusername / STD8-2026-001" className={`input ${errors.identifier ? 'input-error' : ''}`} autoFocus autoComplete="username" />
            </FormField>

            <FormField label="Password" error={errors.password?.message} required>
              <div className="relative">
                <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="••••••••" className={`input pr-10 ${errors.password ? 'input-error' : ''}`} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg w-full">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</> : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:text-primary-700">Request access</Link>
          </p>

          {/* <div className="mt-8 p-4 bg-slate-100 rounded-xl"> */}
            {/* <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Demo credentials</p> */}
            {/* <div className="space-y-1.5 text-xs text-slate-600"> */}
              {/* <div className="flex justify-between"><span className="font-medium">Admin:</span><span>admin@vanitamath.com / Admin@1234</span></div>
              <div className="flex justify-between"><span className="font-medium">Teacher:</span><span>teacher@vanitamath.com / Teacher@1234</span></div>
              <div className="flex justify-between"><span className="font-medium">Student:</span><span>student@vanitamath.com / Student@1234</span></div> */}
            {/* </div>
          </div> */}
        </div>
      </div>
    </div>
  )
}
