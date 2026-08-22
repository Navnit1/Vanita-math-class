import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authService } from '@/services/authService'
import { GraduationCap, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { FormField } from '@/components/ui'
import toast from 'react-hot-toast'

const schema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ password }) => {
    try {
      await authService.resetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError('root', { message: err.response?.data?.message || 'Failed to reset password' })
    }
  }

  if (!token) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center"><p className="text-slate-600">Invalid reset link.</p><Link to="/forgot-password" className="text-primary-600 underline mt-2 block">Request a new one</Link></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <GraduationCap className="w-7 h-7 text-primary-600" />
          <span className="font-bold text-slate-900 text-lg">Vanita Math Classes</span>
        </div>
        <div className="card p-8">
          {done ? (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-900">Password reset!</h2>
              <p className="text-sm text-slate-500 mt-1">Redirecting you to login…</p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-slate-900">Reset password</h1>
              <p className="text-sm text-slate-500 mt-1">Enter your new password below.</p>
              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                {errors.root && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{errors.root.message}</div>}
                <FormField label="New password" error={errors.password?.message} required>
                  <div className="relative">
                    <input {...register('password')} type={showPw ? 'text' : 'password'} className={`input pr-10 ${errors.password ? 'input-error' : ''}`} placeholder="Min 6 characters" />
                    <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormField>
                <FormField label="Confirm password" error={errors.confirmPassword?.message} required>
                  <input {...register('confirmPassword')} type="password" className={`input ${errors.confirmPassword ? 'input-error' : ''}`} placeholder="Repeat new password" />
                </FormField>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg w-full">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Resetting…</> : 'Reset password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
