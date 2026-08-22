import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { KeyRound, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { FormField } from '@/components/ui'
import { authService } from '@/services/authService'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

const schema = z.object({
  currentPassword: z.string().min(1, 'Enter your current (temporary) password'),
  newPassword: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Add an uppercase letter')
    .regex(/[a-z]/, 'Add a lowercase letter')
    .regex(/[0-9]/, 'Add a number'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export default function SetNewPasswordPage() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()
  const [show, setShow] = useState({ current: false, next: false, confirm: false })

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ currentPassword, newPassword }) => {
    try {
      await authService.changePassword(currentPassword, newPassword)
      updateUser({ mustChangePassword: false })
      toast.success('Password updated. Welcome aboard!')
      const redirects = { admin: '/admin', teacher: '/teacher', student: '/dashboard' }
      navigate(redirects[user?.role] || '/dashboard', { replace: true })
    } catch (err) {
      setError('root', { message: err.response?.data?.message || 'Could not update password' })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-5">
            <ShieldCheck className="w-6 h-6 text-primary-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Set a new password</h1>
          <p className="text-slate-500 text-sm mt-1">
            For security, you must set your own password before continuing. Use the temporary password you were given to verify it's you.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {errors.root && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {errors.root.message}
              </div>
            )}

            <FormField label="Current (temporary) password" error={errors.currentPassword?.message} required>
              <div className="relative">
                <input {...register('currentPassword')} type={show.current ? 'text' : 'password'} className={`input pr-10 ${errors.currentPassword ? 'input-error' : ''}`} autoFocus autoComplete="current-password" />
                <button type="button" onClick={() => setShow(s => ({ ...s, current: !s.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {show.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>

            <FormField label="New password" error={errors.newPassword?.message} required hint="At least 8 characters, with uppercase, lowercase, and a number">
              <div className="relative">
                <input {...register('newPassword')} type={show.next ? 'text' : 'password'} className={`input pr-10 ${errors.newPassword ? 'input-error' : ''}`} autoComplete="new-password" />
                <button type="button" onClick={() => setShow(s => ({ ...s, next: !s.next }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {show.next ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>

            <FormField label="Confirm new password" error={errors.confirmPassword?.message} required>
              <div className="relative">
                <input {...register('confirmPassword')} type={show.confirm ? 'text' : 'password'} className={`input pr-10 ${errors.confirmPassword ? 'input-error' : ''}`} autoComplete="new-password" />
                <button type="button" onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>

            <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg w-full">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Updating…</> : <><KeyRound className="w-4 h-4" />Set password & continue</>}
            </button>
          </form>

          <button onClick={logout} className="text-center text-sm text-slate-400 hover:text-slate-600 mt-6 w-full">
            Not you? Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
