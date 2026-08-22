import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, FormField, Avatar } from '@/components/ui'
import { studentService } from '@/services'
import { authService } from '@/services/authService'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/lib/utils'
import { User, Lock, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const pwSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(6, 'Min 6 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

function ChangePasswordForm() {
  const [success, setSuccess] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setError } = useForm({ resolver: zodResolver(pwSchema) })

  const onSubmit = async ({ currentPassword, newPassword }) => {
    try {
      await authService.changePassword(currentPassword, newPassword)
      setSuccess(true)
      reset()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('currentPassword', { message: err.response?.data?.message || 'Failed to change password' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          <CheckCircle className="w-4 h-4" /> Password changed successfully!
        </div>
      )}
      <FormField label="Current Password" error={errors.currentPassword?.message} required>
        <input {...register('currentPassword')} type="password" className={`input ${errors.currentPassword ? 'input-error' : ''}`} placeholder="Your current password" />
      </FormField>
      <FormField label="New Password" error={errors.newPassword?.message} required>
        <input {...register('newPassword')} type="password" className={`input ${errors.newPassword ? 'input-error' : ''}`} placeholder="Min 6 characters" />
      </FormField>
      <FormField label="Confirm New Password" error={errors.confirmPassword?.message} required>
        <input {...register('confirmPassword')} type="password" className={`input ${errors.confirmPassword ? 'input-error' : ''}`} placeholder="Repeat new password" />
      </FormField>
      <div className="flex justify-end">
        <button type="submit" disabled={isSubmitting} className="btn btn-primary">
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Changing…</> : 'Change Password'}
        </button>
      </div>
    </form>
  )
}

export default function StudentProfile() {
  const { user } = useAuth()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: studentService.getMyProfile,
  })

  if (isLoading) return <Sidebar><PageLoader /></Sidebar>

  return (
    <Sidebar>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">View your account information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile card */}
        <div className="card p-6 flex flex-col items-center text-center">
          <Avatar name={user?.name} size="xl" className="mb-4" />
          <h2 className="font-bold text-slate-900 text-lg">{user?.name}</h2>
          <p className="text-slate-500 text-sm">{user?.email}</p>
          <div className="mt-4 w-full space-y-2 text-left">
            {[
              ['Student ID', profile?.studentId],
              ['Class', profile?.class],
              ['Batch', profile?.batch],
              ['Course', profile?.course || '—'],
              ['Admission', formatDate(profile?.admissionDate)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-xs text-slate-500 font-medium">{label}</span>
                <span className="text-xs text-slate-800 font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          {/* Contact info */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-primary-600" />
              <h3 className="font-semibold text-slate-900 text-sm">Contact Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ['Phone', profile?.phone || '—'],
                ['Email', profile?.email],
                ['Parent / Guardian', profile?.parentName || '—'],
                ['Parent Phone', profile?.parentPhone || '—'],
                ['Address', profile?.address || '—'],
              ].map(([label, value]) => (
                <div key={label} className={label === 'Address' ? 'sm:col-span-2' : ''}>
                  <p className="label mb-0.5">{label}</p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Change password */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-primary-600" />
              <h3 className="font-semibold text-slate-900 text-sm">Change Password</h3>
            </div>
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </Sidebar>
  )
}
