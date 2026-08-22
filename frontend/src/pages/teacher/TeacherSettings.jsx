import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Sidebar from '@/components/layout/Sidebar'
import { FormField } from '@/components/ui'
import { authService } from '@/services/authService'
import { useAuth } from '@/contexts/AuthContext'
import { KeyRound, Loader2, Eye, EyeOff, User } from 'lucide-react'
import toast from 'react-hot-toast'

const pwSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Add an uppercase letter')
    .regex(/[0-9]/, 'Add a number'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

export default function TeacherSettings() {
  const { user } = useAuth()
  const [show, setShow] = useState({ c: false, n: false, cf: false })
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setError } = useForm({ resolver: zodResolver(pwSchema) })

  const onSubmit = async ({ currentPassword, newPassword }) => {
    try {
      await authService.changePassword(currentPassword, newPassword)
      toast.success('Password updated successfully')
      reset()
    } catch (err) {
      setError('root', { message: err.response?.data?.message || 'Failed to change password' })
    }
  }

  return (
    <Sidebar>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Your account settings</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Profile info */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><User className="w-4 h-4" />Account Profile</h3>
          <div className="space-y-3 text-sm">
            {[['Name', user?.name], ['Email', user?.email], ['Username', user?.username || '—'], ['Role', 'Teacher']].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-slate-500">{k}</span>
                <span className="font-medium text-slate-900">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Change password */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><KeyRound className="w-4 h-4" />Change Password</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errors.root && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{errors.root.message}</div>}
            {[
              { name: 'currentPassword', label: 'Current password', key: 'c' },
              { name: 'newPassword', label: 'New password', key: 'n', hint: 'Min 8 chars with uppercase & number' },
              { name: 'confirmPassword', label: 'Confirm new password', key: 'cf' },
            ].map(f => (
              <FormField key={f.name} label={f.label} error={errors[f.name]?.message} hint={f.hint} required>
                <div className="relative">
                  <input {...register(f.name)} type={show[f.key] ? 'text' : 'password'} className={`input pr-10 ${errors[f.name] ? 'input-error' : ''}`} />
                  <button type="button" onClick={() => setShow(s => ({ ...s, [f.key]: !s[f.key] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {show[f.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FormField>
            ))}
            <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Updating…</> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </Sidebar>
  )
}
