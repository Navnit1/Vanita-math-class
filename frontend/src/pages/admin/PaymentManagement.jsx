import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Sidebar from '@/components/layout/Sidebar'
import {
  PageLoader, SearchInput, Modal, ConfirmDialog,
  FormField, Select, Badge, Pagination, EmptyState, Avatar, SectionCard,
} from '@/components/ui'
import { paymentService, studentService } from '@/services'
import { formatCurrency, formatDate, paymentMethodLabel } from '@/lib/utils'
import {
  Plus, Trash2, ClipboardList, CheckCircle,
  Upload, Loader2, Eye, X, Download, CreditCard, Wifi, WifiOff, Filter,
} from 'lucide-react'
import toast from 'react-hot-toast'

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

const METHODS = ['cash', 'upi', 'bank_transfer', 'cheque', 'demand_draft']

const schema = z.object({
  studentId: z.string().min(1, 'Select a student'),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  paymentMethod: z.string().min(1, 'Select payment method'),
  paymentDate: z.string().min(1, 'Date is required'),
  month: z.string().optional(),
  notes: z.string().optional(),
})

function AddPaymentForm({ onSave, onCancel, loading }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { paymentDate: new Date().toISOString().split('T')[0] },
  })
  const [receiptFile, setReceiptFile] = useState(null)
  const fileRef = useRef()
  const selectedStudentId = watch('studentId')

  const { data: studentData } = useQuery({
    queryKey: ['students-dropdown'],
    queryFn: () => studentService.getAll({ limit: 300, status: 'active' }),
  })
  const students = studentData?.students || []
  const selectedStudent = students.find(s => s._id === selectedStudentId)
  const pendingFee = selectedStudent
    ? Math.max(0, (selectedStudent.totalFee || 0) - (selectedStudent.paidFee || 0))
    : null

  const handleSave = (data) => {
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== '') fd.append(k, v) })
    if (receiptFile) fd.append('receiptImage', receiptFile)
    onSave(fd)
  }

  return (
    <form onSubmit={handleSubmit(handleSave)} className="p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Student" error={errors.studentId?.message} required className="sm:col-span-2">
          <Select {...register('studentId')} className={errors.studentId ? 'input-error' : ''}>
            <option value="">Select student</option>
            {students.map(s => (
              <option key={s._id} value={s._id}>
                {s.fullName} ({s.studentId}) — {s.class}, {s.batch}
              </option>
            ))}
          </Select>
        </FormField>

        {selectedStudent && (
          <div className="sm:col-span-2 bg-slate-50 rounded-lg px-4 py-3 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-slate-500">Total Fee</p>
              <p className="text-sm font-bold text-slate-800">{formatCurrency(selectedStudent.totalFee)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Paid</p>
              <p className="text-sm font-bold text-green-600">{formatCurrency(selectedStudent.paidFee)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Pending</p>
              <p className="text-sm font-bold text-orange-500">{formatCurrency(pendingFee)}</p>
            </div>
          </div>
        )}

        <FormField label="Amount (₹)" error={errors.amount?.message} required>
          <input
            {...register('amount')}
            type="number"
            className={`input ${errors.amount ? 'input-error' : ''}`}
            placeholder={pendingFee != null ? `Max ₹${pendingFee}` : 'e.g. 3000'}
          />
        </FormField>

        <FormField label="Payment Method" error={errors.paymentMethod?.message} required>
          <Select {...register('paymentMethod')} className={errors.paymentMethod ? 'input-error' : ''}>
            <option value="">Select method</option>
            {METHODS.map(m => <option key={m} value={m}>{paymentMethodLabel(m)}</option>)}
          </Select>
        </FormField>

        <FormField label="Payment Date" error={errors.paymentDate?.message} required>
          <input {...register('paymentDate')} type="date" className="input" />
        </FormField>

        <FormField label="Month" hint="e.g. June 2025">
          <input {...register('month')} className="input" placeholder="June 2025" />
        </FormField>

        <FormField label="Notes" className="sm:col-span-2">
          <textarea {...register('notes')} className="input resize-none" rows={2} placeholder="Additional notes (optional)" />
        </FormField>

        <FormField label="Upload Receipt (optional)" hint="JPG, PNG, PDF — max 5 MB" className="sm:col-span-2">
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
          >
            {receiptFile ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{receiptFile.name}</span>
                <button type="button" onClick={e => { e.stopPropagation(); setReceiptFile(null) }} className="text-red-500 hover:text-red-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <p className="text-sm text-slate-500">Click to upload receipt</p>
              </div>
            )}
            <input ref={fileRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf"
              onChange={e => setReceiptFile(e.target.files?.[0] || null)} />
          </div>
        </FormField>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Recording…</> : 'Record Payment'}
        </button>
      </div>
    </form>
  )
}

export default function PaymentManagement() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [filters, setFilters] = useState({ paymentMethod: '', paymentType: '', status: '' })
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, search, filters],
    queryFn: () => paymentService.getAll({
      page, limit: 15,
      search: search || undefined,
      paymentMethod: filters.paymentMethod || undefined,
      paymentType: filters.paymentType || undefined,
      status: filters.status || undefined,
    }),
    placeholderData: (prev) => prev,
  })

  const { data: stats } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: paymentService.getStats,
  })

  const createMutation = useMutation({
    mutationFn: paymentService.create,
    onSuccess: () => {
      qc.invalidateQueries(['payments'])
      qc.invalidateQueries(['payment-stats'])
      qc.invalidateQueries(['students'])
      qc.invalidateQueries(['admin-dashboard'])
      setModalOpen(false)
      toast.success('Payment recorded successfully')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to record payment'),
  })

  const verifyMutation = useMutation({
    mutationFn: paymentService.verify,
    onSuccess: () => { qc.invalidateQueries(['payments']); toast.success('Payment verified') },
    onError: err => toast.error(err.response?.data?.message || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: paymentService.delete,
    onSuccess: () => {
      qc.invalidateQueries(['payments'])
      qc.invalidateQueries(['payment-stats'])
      qc.invalidateQueries(['students'])
      qc.invalidateQueries(['admin-dashboard'])
      setDeleteTarget(null)
      toast.success('Payment deleted')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed'),
  })

  const payments = data?.payments || []
  const total = data?.total || 0
  const pages = data?.pages || 1

  const onlineStats = stats?.typeBreakdown?.find(t => t._id === 'online') || { total: 0, count: 0 }
  const offlineStats = stats?.typeBreakdown?.find(t => t._id === 'offline') || { total: 0, count: 0 }

  return (
    <Sidebar>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">{total} payment records</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Add Offline Payment
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <div className="stat-card">
          <p className="text-sm text-slate-500">This Month</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(stats?.monthlyRevenue?.total)}</p>
          <p className="text-xs text-slate-500 mt-0.5">{stats?.monthlyRevenue?.count || 0} payments</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-1.5 mb-1">
            <Wifi className="w-3.5 h-3.5 text-blue-500" />
            <p className="text-sm text-slate-500">Online</p>
          </div>
          <p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(onlineStats.total)}</p>
          <p className="text-xs text-slate-500 mt-0.5">{onlineStats.count} payments</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-1.5 mb-1">
            <WifiOff className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-sm text-slate-500">Offline</p>
          </div>
          <p className="text-xl font-bold text-slate-700 mt-1">{formatCurrency(offlineStats.total)}</p>
          <p className="text-xs text-slate-500 mt-0.5">{offlineStats.count} payments</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-slate-500">Methods</p>
          <div className="mt-1 space-y-0.5">
            {(stats?.methodBreakdown || []).slice(0, 3).map(m => (
              <p key={m._id} className="text-xs text-slate-600">
                {paymentMethodLabel(m._id)}: <strong>{formatCurrency(m.total)}</strong>
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Search + filters */}
      <div className="card p-4 mb-4 space-y-3">
        <div className="flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={v => { setSearch(v); setPage(1) }}
            placeholder="Search by student name or ID…"
            className="flex-1"
          />
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`btn btn-secondary btn-sm gap-1.5 ${showFilters ? 'bg-slate-100' : ''}`}
          >
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Payment Method</label>
              <select className="input text-sm"
                value={filters.paymentMethod}
                onChange={e => setFilters(f => ({ ...f, paymentMethod: e.target.value }))}>
                <option value="">All Methods</option>
                {[...METHODS, 'online'].map(m => <option key={m} value={m}>{paymentMethodLabel(m)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Payment Type</label>
              <select className="input text-sm"
                value={filters.paymentType}
                onChange={e => setFilters(f => ({ ...f, paymentType: e.target.value }))}>
                <option value="">All Types</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Status</label>
              <select className="input text-sm"
                value={filters.status}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                <option value="">All Status</option>
                <option value="recorded">Recorded</option>
                <option value="verified">Verified</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="table-container">
        {isLoading ? <PageLoader /> : payments.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No payments found" description="Add an offline payment or wait for online payments." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Method</th>
                <th>Date</th>
                <th>Receipt #</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p._id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Avatar name={p.studentId?.fullName} size="sm" />
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{p.studentId?.fullName}</p>
                        <p className="text-xs text-slate-500">{p.studentId?.studentId}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="font-semibold text-green-600">{formatCurrency(p.amount)}</span></td>
                  <td>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.paymentType === 'online' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {p.paymentType === 'online'
                        ? <><CreditCard className="w-3 h-3" />Online</>
                        : 'Offline'}
                    </span>
                  </td>
                  <td><span className="text-sm">{paymentMethodLabel(p.paymentMethod)}</span></td>
                  <td><span className="text-sm">{formatDate(p.paymentDate)}</span></td>
                  <td><span className="text-xs font-mono text-slate-600">{p.receiptNumber}</span></td>
                  <td>
                    <Badge variant={p.status === 'verified' ? 'green' : 'slate'}>{p.status}</Badge>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {p.receiptImage && (
                        <a href={`${apiBase.replace('/api', '')}${p.receiptImage}`} target="_blank" rel="noreferrer"
                          className="btn btn-ghost btn-sm p-1.5 text-slate-500" title="View uploaded receipt">
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <a href={`${apiBase}/payments/${p._id}/receipt`} target="_blank" rel="noreferrer"
                        className="btn btn-ghost btn-sm p-1.5 text-primary-600" title="Download PDF receipt">
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      {p.status !== 'verified' && (
                        <button onClick={() => verifyMutation.mutate(p._id)} title="Verify"
                          className="btn btn-ghost btn-sm p-1.5 text-green-600">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => setDeleteTarget(p)}
                        className="btn btn-ghost btn-sm p-1.5 text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} pages={pages} onPage={setPage} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Offline Payment" size="lg">
        <AddPaymentForm
          loading={createMutation.isPending}
          onCancel={() => setModalOpen(false)}
          onSave={fd => createMutation.mutate(fd)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        loading={deleteMutation.isPending}
        title="Delete Payment"
        message={`Delete payment of ${formatCurrency(deleteTarget?.amount)} for ${deleteTarget?.studentId?.fullName}? This will reverse the fee balance.`}
        confirmText="Delete"
        danger
      />
    </Sidebar>
  )
}
