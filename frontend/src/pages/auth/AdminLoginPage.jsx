import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { Shield, Eye, EyeOff, Loader2, Phone, MapPin, ArrowLeft } from 'lucide-react'
import { FormField } from '@/components/ui'
import AuthHeader from '@/components/layout/AuthHeader'

const schema = z.object({
  identifier: z.string().min(1, 'Enter your admin email or username'),
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
      if (user.role !== 'admin') {
        setError('root', { message: 'This portal is restricted to Administrator access only. Use Student Login instead.' })
        return
      }
      const from = location.state?.from?.pathname
      navigate(from || '/admin', { replace: true })
    } catch (err) {
      setError('root', { message: err.response?.data?.message || 'Invalid administrator credentials.' })
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between">
      <AuthHeader subtitle="Administrator Access Portal" currentPortal="admin" />

      <div className="max-w-md mx-auto w-full my-auto py-8">
        <div className="bg-white border border-[#D9DDE3] rounded-2xl shadow-card p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#FFF5F5] border border-[#FFCCD0] text-[#C90019] mb-3 shadow-xs">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#171717] tracking-tight">
              Admin Portal
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1.5">
              Secure administrator access for Vanita Math Classes.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errors.root && (
              <div className="bg-[#FFF5F5] border border-[#FFCCD0] text-[#C90019] text-xs sm:text-sm px-4 py-3 rounded-lg font-medium">
                {errors.root.message}
              </div>
            )}

            <FormField label="Administrator Username or Email" error={errors.identifier?.message} required>
              <input
                {...register('identifier')}
                type="text"
                placeholder="admin or admin@vanitamath.com"
                className={`input ${errors.identifier ? 'input-error' : ''}`}
                autoFocus
                autoComplete="username"
              />
            </FormField>

            <FormField label="Password" error={errors.password?.message} required>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#171717]"
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn btn-primary py-3 font-bold text-sm tracking-wide shadow-red-glow mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  Authenticating…
                </>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#D9DDE3] text-center">
            <p className="text-xs text-[#64748B]">
              Looking for student features?{' '}
              <Link to="/login" className="font-semibold text-[#E50914] hover:underline">
                Go to Student Login
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-[#64748B] space-y-1">
          <p className="font-semibold text-[#171717]">Vanita Math Classes · Bathinda, Punjab</p>
          <p className="flex items-center justify-center gap-1">
            <Phone className="w-3.5 h-3.5 text-[#E50914]" /> Contact: 98159-62612
          </p>
        </div>
      </div>

      <footer className="text-center text-xs text-[#64748B] pt-4">
        &copy; {new Date().getFullYear()} Vanita Math Classes
      </footer>
    </div>
  )
}
