import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, EmptyState, TabBar, FormField, Pagination } from '@/components/ui'
import { adminService } from '@/services'
import { authService } from '@/services/authService'
import { useAuth } from '@/contexts/AuthContext'
import { formatDateTime } from '@/lib/utils'
import { Settings as SettingsIcon, KeyRound, ScrollText, Loader2, Eye, EyeOff, User } from 'lucide-react'
import toast from 'react-hot-toast'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z.string().min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Add an uppercase letter')
    .regex(/[a-z]/, 'Add a lowercase letter')
    .regex(/[0-9]/, 'Add a number'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

function PasswordTab() {
  const [show, setShow] = useState({ current: false, next: false, confirm: false })
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setError } = useForm({ resolver: zodResolver(passwordSchema) })

  const onSubmit = async ({ currentPassword, newPassword }) => {
    try {
      await authService.changePassword(currentPassword, newPassword)
      toast.success('Password updated successfully')
      reset()
    } catch (err) {
      setError('root', { message: err.response?.data?.message || 'Could not update password' })
    }
  }

  return (
    <div className="card p-6 max-w-md">
      <h3 className="font-semibold text-slate-900 mb-1">Change Password</h3>
      <p className="text-sm text-slate-500 mb-5">Update your account password.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{errors.root.message}</div>}
        <FormField label="Current password" error={errors.currentPassword?.message} required>
          <div className="relative">
            <input {...register('currentPassword')} type={show.current ? 'text' : 'password'} className={`input pr-10 ${errors.currentPassword ? 'input-error' : ''}`} />
            <button type="button" onClick={() => setShow(s => ({ ...s, current: !s.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {show.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </FormField>
        <FormField label="New password" error={errors.newPassword?.message} required hint="At least 8 characters, with uppercase, lowercase, and a number">
          <div className="relative">
            <input {...register('newPassword')} type={show.next ? 'text' : 'password'} className={`input pr-10 ${errors.newPassword ? 'input-error' : ''}`} />
            <button type="button" onClick={() => setShow(s => ({ ...s, next: !s.next }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {show.next ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </FormField>
        <FormField label="Confirm new password" error={errors.confirmPassword?.message} required>
          <div className="relative">
            <input {...register('confirmPassword')} type={show.confirm ? 'text' : 'password'} className={`input pr-10 ${errors.confirmPassword ? 'input-error' : ''}`} />
            <button type="button" onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </FormField>
        <button type="submit" disabled={isSubmitting} className="btn btn-primary">
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Updating…</> : 'Update Password'}
        </button>
      </form>
    </div>
  )
}

function ProfileTab() {
  const { user } = useAuth()
  return (
    <div className="card p-6 max-w-md">
      <h3 className="font-semibold text-slate-900 mb-1">Account Profile</h3>
      <p className="text-sm text-slate-500 mb-5">Your account details.</p>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between py-2 border-b border-slate-50">
          <span className="text-slate-500">Name</span><span className="font-medium text-slate-900">{user?.name}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-slate-50">
          <span className="text-slate-500">Email</span><span className="font-medium text-slate-900">{user?.email}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-slate-50">
          <span className="text-slate-500">Username</span><span className="font-mono text-slate-900">{user?.username || '—'}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-slate-500">Role</span><span className="font-medium text-slate-900 capitalize">{user?.role}</span>
        </div>
      </div>
    </div>
  )
}

function AuditLogTab() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () => adminService.getAuditLogs({ page, limit: 20 }),
  })

  const logs = data?.logs || []
  const pages = data?.pages || 1

  return (
    <div className="table-container">
      {isLoading ? <PageLoader /> : logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No activity yet" description="Admin actions like creating students, marking attendance, and posting announcements will appear here." />
      ) : (
        <table className="table">
          <thead><tr><th>Action</th><th>Performed By</th><th>Description</th><th>When</th></tr></thead>
          <tbody>
            {logs.map(l => (
              <tr key={l._id}>
                <td><span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded">{l.action}</span></td>
                <td>
                  <p className="text-sm font-medium text-slate-900">{l.performedByName}</p>
                  <p className="text-xs text-slate-500 capitalize">{l.performedByRole}</p>
                </td>
                <td className="text-sm text-slate-600">{l.description}</td>
                <td className="text-xs text-slate-500">{formatDateTime(l.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Pagination page={page} pages={pages} onPage={setPage} />
    </div>
  )
}

export default function Settings() {
  const [tab, setTab] = useState('profile')

  return (
    <Sidebar>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and review system activity</p>
      </div>

      <TabBar
        tabs={[
          { value: 'profile', label: 'Profile' },
          { value: 'password', label: 'Password' },
          { value: 'audit', label: 'Activity Log' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="mt-5">
        {tab === 'profile' && <ProfileTab />}
        {tab === 'password' && <PasswordTab />}
        {tab === 'audit' && <AuditLogTab />}
      </div>
    </Sidebar>
  )
}
