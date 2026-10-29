import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff, Loader2, Phone, MapPin, Award, ArrowRight, UserPlus, HelpCircle, Shield, LogIn } from 'lucide-react'
import { FormField } from '@/components/ui'
import AuthHeader from '@/components/layout/AuthHeader'

const schema = z.object({
  identifier: z.string().min(1, 'Enter your email, username, or Student ID / Roll Number'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPw, setShowPw] = useState(false)
  const [isStaffMode, setIsStaffMode] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ identifier, password }) => {
    try {
      const user = await login(identifier, password)
      if (isStaffMode && user.role !== 'admin') {
        setError('root', { message: 'This login mode is for Administrator only. Please switch to Student Login.' })
        return
      }
      if (!isStaffMode && user.role === 'admin') {
        // Admin logging in via general form — redirect cleanly to /admin
        navigate('/admin', { replace: true })
        return
      }
      const from = location.state?.from?.pathname
      navigate(from || (user.role === 'admin' ? '/admin' : '/dashboard'), { replace: true })
    } catch (err) {
      setError('root', { message: err.response?.data?.message || 'Invalid login ID or password. Please try again.' })
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between">
      <AuthHeader subtitle="Student & Parent Portal · Mathematics 8th–+2" currentPortal="student" />

      {/* Main Container */}
      <div className="max-w-md mx-auto w-full my-auto py-8">
        {/* Card */}
        <div className="bg-white border border-[#D9DDE3] rounded-2xl shadow-card p-6 sm:p-8">
          {/* VMC Branding & Description */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#FFF5F5] border border-[#FFCCD0] text-[#E50914] mb-3 shadow-xs">
              {isStaffMode ? <Shield className="w-6 h-6 text-[#C90019]" /> : <LogIn className="w-6 h-6 text-[#E50914]" />}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#171717] tracking-tight">
              {isStaffMode ? 'Administrator Sign In' : 'Student Portal Sign In'}
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1.5">
              {isStaffMode
                ? 'Authorized access for Vanita Math Classes administration.'
                : 'Access your weekly tests, marks, study notes, fee records, and receipts.'}
            </p>
          </div>

          {/* Access Switcher (Student Login vs Admin Login) */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#F3F4F6] border border-[#D9DDE3] rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setIsStaffMode(false)}
              className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                !isStaffMode
                  ? 'bg-white text-[#C90019] shadow-xs'
                  : 'text-[#64748B] hover:text-[#171717]'
              }`}
            >
              Student Login
            </button>
            <button
              type="button"
              onClick={() => setIsStaffMode(true)}
              className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                isStaffMode
                  ? 'bg-[#E50914] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#171717]'
              }`}
            >
              Admin Login
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errors.root && (
              <div className="bg-[#FFF5F5] border border-[#FFCCD0] text-[#C90019] text-xs sm:text-sm px-4 py-3 rounded-lg font-medium">
                {errors.root.message}
              </div>
            )}

            <FormField
              label={isStaffMode ? 'Admin Username or Email' : 'Student ID, Roll Number, or Username'}
              error={errors.identifier?.message}
              required
            >
              <input
                {...register('identifier')}
                type="text"
                placeholder={isStaffMode ? 'admin or admin@vanitamath.com' : 'e.g. STD8-2026-001 or username'}
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

            <div className="flex justify-end pt-1">
              <Link to="/forgot-password" className="text-xs sm:text-sm font-semibold text-[#E50914] hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn btn-primary py-3 font-bold text-sm tracking-wide shadow-red-glow"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  Verifying Credentials…
                </>
              ) : (
                `Sign in as ${isStaffMode ? 'Admin' : 'Student'}`
              )}
            </button>
          </form>

          {/* Four Distinct Access Options */}
          <div className="mt-8 pt-6 border-t border-[#D9DDE3]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] text-center mb-3">
              Other Access Options
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                to="/register"
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-[#D9DDE3] bg-[#FAFAFA] font-semibold text-[#171717] hover:bg-[#FFF5F5] hover:text-[#C90019] hover:border-[#FFCCD0] transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#E50914]" />
                Student Registration
              </Link>
              <Link
                to="/#contact"
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-[#D9DDE3] bg-[#FAFAFA] font-semibold text-[#171717] hover:bg-[#FFF5F5] hover:text-[#C90019] hover:border-[#FFCCD0] transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#E50914]" />
                Enquiry / Admission
              </Link>
            </div>
          </div>
        </div>

        {/* Faculty & Institute Contact Footer Card */}
        <div className="mt-6 text-center text-xs text-[#64748B] space-y-1">
          <p className="font-semibold text-[#171717]">
            Faculty: Vanita Rani Gupta (M.Sc., M.Phil., B.Ed. · 17+ Years Experience)
          </p>
          <p className="flex items-center justify-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#E50914] shrink-0" />
            #302, Phase-II, Vishal Nagar, Bathinda
          </p>
          <p className="flex items-center justify-center gap-1">
            <Phone className="w-3.5 h-3.5 text-[#E50914] shrink-0" />
            Admissions & Assistance: <strong>98159-62612</strong>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-[#64748B] pt-4">
        &copy; {new Date().getFullYear()} Vanita Math Classes. All rights reserved.
      </footer>
    </div>
  )
}
