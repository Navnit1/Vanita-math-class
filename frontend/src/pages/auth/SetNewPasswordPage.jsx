import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/authService'
import { KeyRound, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { FormField } from '@/components/ui'
import AuthHeader from '@/components/layout/AuthHeader'
import toast from 'react-hot-toast'

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export default function SetNewPasswordPage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ currentPassword, newPassword }) => {
    try {
      await authService.changePassword(currentPassword, newPassword)
      updateUser({ mustChangePassword: false })
      toast.success('Password updated successfully! Welcome to your portal.')
      navigate(user?.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
    } catch (err) {
      setError('root', { message: err.response?.data?.message || 'Failed to change password. Please check your current password.' })
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between">
      <AuthHeader subtitle="First-Time Login · Security Setup" currentPortal="student" />
      <div className="my-auto py-8 px-4 sm:px-6">
        <div className="bg-white border border-[#D9DDE3] rounded-2xl shadow-card p-6 sm:p-8 max-w-md w-full mx-auto">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#FFF5F5] border border-[#FFCCD0] text-[#C90019] flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#171717] tracking-tight">
            Set Your Permanent Password
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1.5">
            You are logged in with temporary credentials. For your account security, please create a personal password.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root && (
            <div className="bg-[#FFF5F5] border border-[#FFCCD0] text-[#C90019] text-xs sm:text-sm p-3.5 rounded-lg font-medium">
              {errors.root.message}
            </div>
          )}

          <FormField label="Temporary / Current Password" error={errors.currentPassword?.message} required>
            <div className="relative">
              <input
                {...register('currentPassword')}
                type={showCurrent ? 'text' : 'password'}
                placeholder="••••••••"
                className={`input pr-10 ${errors.currentPassword ? 'input-error' : ''}`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowCurrent(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>

          <FormField label="Create New Password" error={errors.newPassword?.message} required>
            <div className="relative">
              <input
                {...register('newPassword')}
                type={showNew ? 'text' : 'password'}
                placeholder="Min 6 characters"
                className={`input pr-10 ${errors.newPassword ? 'input-error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowNew(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>

          <FormField label="Confirm New Password" error={errors.confirmPassword?.message} required>
            <input
              {...register('confirmPassword')}
              type={showNew ? 'text' : 'password'}
              placeholder="Re-enter new password"
              className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
            />
          </FormField>

          <div className="flex items-center gap-2 text-xs text-[#64748B] pt-1">
            <ShieldCheck className="w-4 h-4 text-[#059669]" />
            <span>Passphrase must be minimum 6 characters.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn btn-primary py-3 font-bold text-sm tracking-wide shadow-red-glow mt-2"
          >
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Updating Password…</> : 'Save Password & Continue'}
          </button>
        </form>
      </div>
      </div>
    </div>
  )
}
