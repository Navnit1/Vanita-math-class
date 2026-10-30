import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Sidebar from '@/components/layout/Sidebar'
import {
  PageLoader,
  Modal,
  ConfirmDialog,
  FormField,
  Select,
  Badge,
  Pagination,
  EmptyState,
  StatCard,
} from '@/components/ui'
import { feeService, studentService, announcementService } from '@/services'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getWhatsAppFeeReminderUrl } from '@/lib/whatsapp'
import {
  Plus,
  Trash2,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Users,
  Bell,
  MessageSquare,
} from 'lucide-react'
import toast from 'react-hot-toast'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const CURRENT_YEAR = new Date().getFullYear()
const FEE_TYPES = ['monthly', 'quarterly', 'annual', 'registration', 'exam', 'other']
const BATCHES = ['Morning', 'Evening', 'Weekend']
const CLASSES = ['8th', '9th', '10th', '+1', '+2']

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
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const { data: studentData } = useQuery({
    queryKey: ['students-dropdown'],
    queryFn: () => studentService.getAll({ limit: 200, status: 'active' }),
    enabled: mode === 'single',
  })
  const students = studentData?.students || []

  return (
    <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-4">
      {mode === 'bulk' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm px-4 py-3 rounded-lg">
          Bulk fee will be created for all <strong>active students</strong> matching the selected batch/class. Leave blank to target all active students.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {mode === 'single' && (
          <FormField label="Student" error={errors.studentId?.message} required className="sm:col-span-2">
            <Select {...register('studentId')} className={errors.studentId ? 'input-error' : ''}>
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.fullName} ({s.studentId}) — Class {s.class}, {s.batch}
                </option>
              ))}
            </Select>
          </FormField>
        )}

        {mode === 'bulk' && (
          <>
            <FormField label="Filter by Batch (optional)">
              <Select {...register('batch')}>
                <option value="">All batches</option>
                {BATCHES.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Filter by Class (optional)">
              <Select {...register('class')}>
                <option value="">All classes</option>
                {CLASSES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </FormField>
          </>
        )}

        <FormField label="Fee Type" error={errors.feeType?.message} required>
          <Select {...register('feeType')} className={errors.feeType ? 'input-error' : ''}>
            <option value="">Select type</option>
            {FEE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Amount (₹)" error={errors.amount?.message} required>
          <input
            {...register('amount')}
            type="number"
            className={`input ${errors.amount ? 'input-error' : ''}`}
            placeholder="e.g. 2500"
          />
        </FormField>

        <FormField label="Due Date" error={errors.dueDate?.message} required>
          <input {...register('dueDate')} type="date" className="input" />
        </FormField>

        <FormField label="Month" hint="e.g. October 2026">
          <input {...register('month')} className="input" placeholder="e.g. October 2026" />
        </FormField>

        <FormField label="Remarks" className="sm:col-span-2">
          <textarea
            {...register('remarks')}
            className="input resize-none"
            rows={2}
            placeholder="Optional notes"
          />
        </FormField>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating…
            </>
          ) : mode === 'bulk' ? (
            'Create Bulk Fees'
          ) : (
            'Create Fee Record'
          )}
        </button>
      </div>
    </form>
  )
}

export default function FeeManagement() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('single')
  const [reminderLoading, setReminderLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')

  const sendFeeReminders = async () => {
    if (
      !window.confirm(
        'Send a fee reminder announcement to all students with pending/overdue fees?'
      )
    ) {
      return
    }
    setReminderLoading(true)
    try {
      await announcementService.create({
        title: 'Fee Payment Reminder',
        content: `Dear Students/Parents,\n\nThis is a gentle reminder from Vanita Math Classes regarding pending monthly tuition fee dues. Kindly clear the pending balance at your earliest convenience.\n\nFor details or online payments, visit the Student Portal or contact the institute desk.\n\nVanita Math Classes, Bathinda\nPhone: +91 98159-62612`,
        audience: 'students',
        priority: 'high',
        class: '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
      toast.success('Fee reminder notice published for students')
    } catch {
      toast.error('Failed to send reminder')
    } finally {
      setReminderLoading(false)
    }
  }

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
    mutationFn: (payload) =>
      modalMode === 'bulk' ? feeService.createBulk(payload) : feeService.create(payload),
    onSuccess: (res) => {
      qc.invalidateQueries(['fees'])
      qc.invalidateQueries(['fee-stats'])
      qc.invalidateQueries(['admin-dashboard'])
      setModalOpen(false)
      toast.success(res?.message || 'Fee record created')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: feeService.delete,
    onSuccess: () => {
      qc.invalidateQueries(['fees'])
      qc.invalidateQueries(['fee-stats'])
      qc.invalidateQueries(['admin-dashboard'])
      setDeleteTarget(null)
      toast.success('Fee record deleted')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const fees = data?.fees || []
  const total = data?.total || 0
  const pages = data?.pages || 1

  const statMap = {}
  ;(stats?.overview || []).forEach((s) => {
    statMap[s._id] = s
  })

  const openModal = (mode) => {
    setModalMode(mode)
    setModalOpen(true)
  }

  return (
    <Sidebar>
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Fee Management & Ledger</h1>
          <p className="page-subtitle">{total} fee records tracked</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={sendFeeReminders}
            disabled={reminderLoading}
            className="btn btn-outline border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            {reminderLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
            Broadcast Reminders
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Balance Due"
          value={formatCurrency(
            (statMap.pending?.amount || 0) +
              (statMap.overdue?.amount || 0) +
              (statMap.partial?.amount || 0)
          )}
          icon={DollarSign}
          subtext="Pending & overdue"
        />
        <StatCard
          label="Total Collected"
          value={formatCurrency(statMap.paid?.amount || 0)}
          icon={CheckCircle}
          subtext={`${statMap.paid?.count || 0} cleared records`}
        />
        <StatCard
          label="Pending Fees"
          value={formatCurrency(statMap.pending?.amount || 0)}
          icon={Clock}
          subtext={`${statMap.pending?.count || 0} records`}
        />
        <StatCard
          label="Overdue Fees"
          value={formatCurrency(statMap.overdue?.amount || 0)}
          icon={AlertCircle}
          subtext={`${statMap.overdue?.count || 0} overdue`}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
        <Select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value)
            setPage(1)
          }}
          className="w-44"
        >
          <option value="">All Payment Statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="overdue">Overdue</option>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : fees.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="No fee records found"
            description="Create fee records individually or in bulk for your classes."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Fee Type</th>
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fees.map((f) => {
                  const student = f.studentId
                  const remaining = Math.max(0, f.amount - (f.paidAmount || 0))
                  const studentPhone = student?.parentPhone || student?.phone
                  const whatsappUrl = studentPhone ? getWhatsAppFeeReminderUrl({
                    parentPhone: student?.parentPhone,
                    phone: student?.phone,
                    parentName: student?.parentName,
                    fullName: student?.fullName,
                    studentId: student?.studentId,
                    class: student?.class,
                    dueAmount: remaining,
                  }) : null

                  return (
                    <tr key={f._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-gray-900">{student?.fullName || '—'}</p>
                        <p className="text-xs text-gray-500">
                          {student?.studentId} · Class {student?.class}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium capitalize text-gray-700">
                        {f.feeType}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-800 font-semibold">
                        {f.month || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {formatCurrency(f.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold text-xs ${
                            f.paidAmount > 0 ? 'text-emerald-600' : 'text-gray-400'
                          }`}
                        >
                          {formatCurrency(f.paidAmount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {formatDate(f.dueDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            f.paymentStatus === 'paid'
                              ? 'success'
                              : f.paymentStatus === 'partial'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {f.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {f.paymentStatus !== 'paid' && whatsappUrl && (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Send 1-Click WhatsApp reminder to parent"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => setDeleteTarget(f)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-red-50 transition-colors"
                            title="Delete fee record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pages={pages} onPage={setPage} />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalMode === 'bulk' ? 'Bulk Create Fee Records' : 'Add Fee Record'}
        size="lg"
      >
        <AddFeeForm
          mode={modalMode}
          loading={createMutation.isPending}
          onCancel={() => setModalOpen(false)}
          onSave={(data) => createMutation.mutate(data)}
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
