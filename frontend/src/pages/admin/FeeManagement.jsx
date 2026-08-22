import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Sidebar from '@/components/layout/Sidebar'
import {
  PageLoader, SearchInput, Modal, ConfirmDialog, FormField,
  Select, Badge, Pagination, EmptyState, StatCard, SectionCard,
} from '@/components/ui'
import { feeService, studentService, announcementService } from '@/services'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Trash2, DollarSign, AlertCircle, CheckCircle, Clock, Loader2, Users, Bell } from 'lucide-react'
import toast from 'react-hot-toast'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const CURRENT_YEAR = new Date().getFullYear()
const FEE_TYPES = ['monthly', 'quarterly', 'annual', 'registration', 'exam', 'other']
const BATCHES = ['Morning', 'Evening', 'Weekend']
const CLASSES = [ '8th', '9th', '10th','11th', '12th' ]

const singleSchema = z.object({
  studentId: z.string().min(1, 'Select a student'),
  feeType: z.string().min(1, 'Select fee type'),
  amount: z.coerce.number().min(1, 'Amount required'),
  dueDate: z.string().min(1, 'Due date required'),
  month: z.string().optional(),
  remarks: z.string().optional(),
})

const bulkSchema = z.object({
  batch: z.string().optional(),
  class: z.string().optional(),
  feeType: z.string().min(1, 'Select fee type'),
  amount: z.coerce.number().min(1, 'Amount required'),
  dueDate: z.string().min(1, 'Due date required'),
  month: z.string().optional(),
  remarks: z.string().optional(),
})

function AddFeeForm({ onSave, onCancel, loading, mode }) {
  const schema = mode === 'bulk' ? bulkSchema : singleSchema
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const { data: studentData } = useQuery({
    queryKey: ['students-dropdown'],
    queryFn: () => studentService.getAll({ limit: 200, status: 'active' }),
    enabled: mode === 'single',
  })
  const students = studentData?.students || []

  return (
    <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-4">
      {mode === 'bulk' && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-3 rounded-lg">
          Bulk fee will be created for all <strong>active students</strong> matching the selected batch/class. Leave blank to target all active students.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {mode === 'single' && (
          <FormField label="Student" error={errors.studentId?.message} required className="sm:col-span-2">
            <Select {...register('studentId')} className={errors.studentId ? 'input-error' : ''}>
              <option value="">Select student</option>
              {students.map(s => <option key={s._id} value={s._id}>{s.fullName} ({s.studentId}) — {s.class}, {s.batch}</option>)}
            </Select>
          </FormField>
        )}

        {mode === 'bulk' && (
          <>
            <FormField label="Filter by Batch (optional)">
              <Select {...register('batch')}>
                <option value="">All batches</option>
                {BATCHES.map(b => <option key={b}>{b}</option>)}
              </Select>
            </FormField>
            <FormField label="Filter by Class (optional)">
              <Select {...register('class')}>
                <option value="">All classes</option>
                {CLASSES.map(c => <option key={c}>{c}</option>)}
              </Select>
            </FormField>
          </>
        )}

        <FormField label="Fee Type" error={errors.feeType?.message} required>
          <Select {...register('feeType')} className={errors.feeType ? 'input-error' : ''}>
            <option value="">Select type</option>
            {FEE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </Select>
        </FormField>

        <FormField label="Amount (₹)" error={errors.amount?.message} required>
          <input {...register('amount')} type="number" className={`input ${errors.amount ? 'input-error' : ''}`} placeholder="e.g. 3000" />
        </FormField>

        <FormField label="Due Date" error={errors.dueDate?.message} required>
          <input {...register('dueDate')} type="date" className="input" />
        </FormField>

        <FormField label="Month" hint="e.g. June 2025">
          <input {...register('month')} className="input" placeholder="June 2025" />
        </FormField>

        <FormField label="Remarks" className="sm:col-span-2">
          <textarea {...register('remarks')} className="input resize-none" rows={2} placeholder="Optional notes" />
        </FormField>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating…</> : mode === 'bulk' ? 'Create Bulk Fees' : 'Create Fee Record'}
        </button>
      </div>
    </form>
  )
}

export default function FeeManagement() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('single')
  const [reminderLoading, setReminderLoading] = useState(false)

  const sendFeeReminders = async () => {
    if (!window.confirm('Send a fee reminder announcement to all students with pending/overdue fees? This will create a high-priority announcement visible to all standards.')) return
    setReminderLoading(true)
    try {
      await announcementService.create({
        title: 'Fee Payment Reminder',
        content: `This is a reminder that your fee payment is pending or overdue. Please clear your dues at the earliest to avoid any interruption to your classes. For payment, please visit the student portal or contact the admin.\n\nThank you,\nVanita Math Classes`,
        audience: 'students',
        priority: 'high',
        class: '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
      toast.success('Fee reminder sent to all students')
    } catch {
      toast.error('Failed to send reminder')
    } finally {
      setReminderLoading(false)
    }
  }
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['fees', page, filterStatus],
    queryFn: () => feeService.getAll({ page, limit: 15, paymentStatus: filterStatus || undefined }),
    placeholderData: (prev) => prev,
  })

  const { data: stats } = useQuery({
    queryKey: ['fee-stats'],
    queryFn: feeService.getStats,
  })

  const createMutation = useMutation({
    mutationFn: (payload) => modalMode === 'bulk' ? feeService.createBulk(payload) : feeService.create(payload),
    onSuccess: (res) => {
      qc.invalidateQueries(['fees'])
      qc.invalidateQueries(['fee-stats'])
      setModalOpen(false)
      toast.success(res?.message || 'Fee record created')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: feeService.delete,
    onSuccess: () => { qc.invalidateQueries(['fees']); qc.invalidateQueries(['fee-stats']); setDeleteTarget(null); toast.success('Fee record deleted') },
    onError: err => toast.error(err.response?.data?.message || 'Failed'),
  })

  const fees = data?.fees || []
  const total = data?.total || 0
  const pages = data?.pages || 1

  const statMap = {}
  ;(stats?.overview || []).forEach(s => { statMap[s._id] = s })

  const openModal = (mode) => { setModalMode(mode); setModalOpen(true) }

  return (
    <Sidebar>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Fee Management</h1>
          <p className="page-subtitle">{total} fee records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={sendFeeReminders} disabled={reminderLoading} className="btn btn-secondary text-orange-600 border-orange-200 hover:bg-orange-50">
            {reminderLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />} Send Reminders
          </button>
          <button onClick={() => openModal('bulk')} className="btn btn-secondary">
            <Users className="w-4 h-4" /> Bulk Create
          </button>
          <button onClick={() => openModal('single')} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Add Fee
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard title="Total Dues" value={formatCurrency((statMap.pending?.amount || 0) + (statMap.overdue?.amount || 0) + (statMap.partial?.amount || 0))} icon={DollarSign} color="blue" />
        <StatCard title="Collected" value={formatCurrency(statMap.paid?.amount || 0)} icon={CheckCircle} color="green" subtitle={`${statMap.paid?.count || 0} records`} />
        <StatCard title="Pending" value={formatCurrency(statMap.pending?.amount || 0)} icon={Clock} color="orange" subtitle={`${statMap.pending?.count || 0} records`} />
        <StatCard title="Overdue" value={formatCurrency(statMap.overdue?.amount || 0)} icon={AlertCircle} color="red" subtitle={`${statMap.overdue?.count || 0} records`} />
      </div>

      <div className="card p-4 mb-4 flex flex-wrap gap-3">
        <Select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }} className="w-40">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="overdue">Overdue</option>
        </Select>
      </div>

      <div className="table-container">
        {isLoading ? <PageLoader /> : fees.length === 0 ? (
          <EmptyState icon={DollarSign} title="No fee records" description="Create fee records individually or in bulk" />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Type</th>
                <th>Month</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Due Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {fees.map(f => (
                <tr key={f._id}>
                  <td>
                    <p className="font-medium text-sm text-slate-900">{f.studentId?.fullName}</p>
                    <p className="text-xs text-slate-500">{f.studentId?.studentId}</p>
                  </td>
                  <td><span className="text-sm capitalize">{f.feeType}</span></td>
                  <td><span className="text-sm">{f.month || '—'}</span></td>
                  <td><span className="font-medium text-sm">{formatCurrency(f.amount)}</span></td>
                  <td>
                    <span className={`text-sm font-medium ${f.paidAmount > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                      {formatCurrency(f.paidAmount)}
                    </span>
                  </td>
                  <td><span className="text-sm">{formatDate(f.dueDate)}</span></td>
                  <td>
                    <Badge variant={f.paymentStatus === 'paid' ? 'green' : f.paymentStatus === 'partial' ? 'yellow' : f.paymentStatus === 'overdue' ? 'red' : 'slate'}>
                      {f.paymentStatus}
                    </Badge>
                  </td>
                  <td>
                    <button onClick={() => setDeleteTarget(f)} className="btn btn-ghost btn-sm p-1.5 text-red-500 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} pages={pages} onPage={setPage} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalMode === 'bulk' ? 'Bulk Create Fee Records' : 'Add Fee Record'} size="lg">
        <AddFeeForm
          mode={modalMode}
          loading={createMutation.isPending}
          onCancel={() => setModalOpen(false)}
          onSave={data => createMutation.mutate(data)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        loading={deleteMutation.isPending}
        title="Delete Fee Record"
        message={`Delete fee of ${formatCurrency(deleteTarget?.amount)} for ${deleteTarget?.studentId?.fullName}?`}
        confirmText="Delete"
        danger
      />
    </Sidebar>
  )
}
