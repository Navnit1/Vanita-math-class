import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Sidebar from '@/components/layout/Sidebar'
import {
  PageLoader,
  SearchInput,
  Modal,
  ConfirmDialog,
  FormField,
  Select,
  Badge,
  Pagination,
  EmptyState,
  Avatar,
  StatCard,
} from '@/components/ui'
import { paymentService, studentService } from '@/services'
import { formatCurrency, formatDate, paymentMethodLabel } from '@/lib/utils'
import {
  Plus,
  Trash2,
  ClipboardList,
  CheckCircle,
  Upload,
  Loader2,
  Eye,
  X,
  Download,
  CreditCard,
  Wifi,
  WifiOff,
  Filter,
  Share2,
  MessageSquare,
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
  const selectedStudent = students.find((s) => s._id === selectedStudentId)
  const pendingFee = selectedStudent
    ? Math.max(0, (selectedStudent.totalFee || 0) - (selectedStudent.paidFee || 0))
    : null

  const handleSave = (data) => {
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== '') fd.append(k, v)
    })
    if (receiptFile) fd.append('receiptImage', receiptFile)
    onSave(fd)
  }

  return (
    <form onSubmit={handleSubmit(handleSave)} className="p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {selectedStudent && (
          <div className="sm:col-span-2 bg-gray-50 rounded-xl p-3.5 grid grid-cols-3 gap-3 text-center border border-gray-200">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Fee</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {formatCurrency(selectedStudent.totalFee)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Paid</p>
              <p className="text-sm font-bold text-emerald-600 mt-0.5">
                {formatCurrency(selectedStudent.paidFee)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Pending Dues</p>
              <p className="text-sm font-bold text-primary-600 mt-0.5">
                {formatCurrency(pendingFee)}
              </p>
            </div>
          </div>
        )}

        <FormField label="Amount Received (₹)" error={errors.amount?.message} required>
          <input
            {...register('amount')}
            type="number"
            className={`input ${errors.amount ? 'input-error' : ''}`}
            placeholder={pendingFee != null ? `Max ₹${pendingFee}` : 'e.g. 2500'}
          />
        </FormField>

        <FormField label="Payment Method" error={errors.paymentMethod?.message} required>
          <Select {...register('paymentMethod')} className={errors.paymentMethod ? 'input-error' : ''}>
            <option value="">Select method</option>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {paymentMethodLabel(m)}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Payment Date" error={errors.paymentDate?.message} required>
          <input {...register('paymentDate')} type="date" className="input" />
        </FormField>

        <FormField label="Billing Month / Period" hint="e.g. October 2026">
          <input {...register('month')} className="input" placeholder="e.g. October 2026" />
        </FormField>

        <FormField label="Notes / Reference No" className="sm:col-span-2">
          <textarea
            {...register('notes')}
            className="input resize-none"
            rows={2}
            placeholder="Cheque number, UPI ref, or cash receipt notes"
          />
        </FormField>

        <FormField label="Attach Physical Receipt (optional)" hint="JPG, PNG, PDF — max 5 MB" className="sm:col-span-2">
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
          >
            {receiptFile ? (
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">{receiptFile.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setReceiptFile(null)
                  }}
                  className="text-primary-600 hover:text-primary-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-600">Click to upload slip or voucher</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            />
          </div>
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
              Recording Receipt…
            </>
          ) : (
            'Record Payment & Issue Receipt'
          )}
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
    queryFn: () =>
      paymentService.getAll({
        page,
        limit: 15,
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
      toast.success('Payment recorded and official VMC receipt generated')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to record payment'),
  })

  const verifyMutation = useMutation({
    mutationFn: paymentService.verify,
    onSuccess: () => {
      qc.invalidateQueries(['payments'])
      toast.success('Payment verified')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
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
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const payments = data?.payments || []
  const total = data?.total || 0
  const pages = data?.pages || 1

  const onlineStats = stats?.typeBreakdown?.find((t) => t._id === 'online') || { total: 0, count: 0 }
  const offlineStats = stats?.typeBreakdown?.find((t) => t._id === 'offline') || { total: 0, count: 0 }

  const handleDownloadReceipt = async (p) => {
    try {
      toast.loading('Generating VMC receipt PDF...', { id: 'receipt-dl' })
      await paymentService.downloadReceipt(p._id, p.receiptNumber)
      toast.success('Receipt downloaded successfully!', { id: 'receipt-dl' })
    } catch {
      toast.error('Failed to download receipt PDF.', { id: 'receipt-dl' })
    }
  }

  return (
    <Sidebar>
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Fee Payments & Receipts</h1>
          <p className="page-subtitle">{total} payment transactions recorded</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn btn-primary self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Record Offline Payment
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="This Month"
          value={formatCurrency(stats?.monthlyRevenue?.total)}
          icon={CheckCircle}
          subtext={`${stats?.monthlyRevenue?.count || 0} payments`}
        />
        <StatCard
          label="Online (Razorpay)"
          value={formatCurrency(onlineStats.total)}
          icon={Wifi}
          subtext={`${onlineStats.count} payments`}
        />
        <StatCard
          label="Offline Receipts"
          value={formatCurrency(offlineStats.total)}
          icon={WifiOff}
          subtext={`${offlineStats.count} payments`}
        />
        <StatCard
          label="Top Modes"
          value={paymentMethodLabel(stats?.methodBreakdown?.[0]?._id || 'cash')}
          icon={CreditCard}
          subtext={formatCurrency(stats?.methodBreakdown?.[0]?.total || 0)}
        />
      </div>

      {/* Search + filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v)
              setPage(1)
            }}
            placeholder="Search by student name or roll number…"
            className="flex-1"
          />
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`btn btn-secondary btn-sm gap-1.5 ${showFilters ? 'bg-gray-100' : ''}`}
          >
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Payment Method</label>
              <select
                className="input text-xs"
                value={filters.paymentMethod}
                onChange={(e) => setFilters((f) => ({ ...f, paymentMethod: e.target.value }))}
              >
                <option value="">All Methods</option>
                {[...METHODS, 'online'].map((m) => (
                  <option key={m} value={m}>
                    {paymentMethodLabel(m)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Payment Type</label>
              <select
                className="input text-xs"
                value={filters.paymentType}
                onChange={(e) => setFilters((f) => ({ ...f, paymentType: e.target.value }))}
              >
                <option value="">All Types</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Status</label>
              <select
                className="input text-xs"
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="">All Statuses</option>
                <option value="recorded">Recorded</option>
                <option value="verified">Verified</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : payments.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No payments found"
            description="Add an offline payment or wait for students to pay online."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => {
                  const student = p.studentId
                  const studentPhone = student?.parentPhone || student?.phone
                  const whatsappMsg = encodeURIComponent(
                    `Fee Receipt from Vanita Math Classes: Receipt No: ${p.receiptNumber}, Student: ${student?.fullName || 'Student'} (Class ${student?.class || ''}), Amount Paid: ₹${p.amount}, Date: ${formatDate(p.paymentDate)}. Thank you! Vanita Rani Gupta (+91 98159-62612)`
                  )
                  const whatsappUrl = studentPhone ? `https://wa.me/91${studentPhone.replace(/\D/g, '')}?text=${whatsappMsg}` : null

                  return (
                    <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <Avatar name={student?.fullName} size="sm" />
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{student?.fullName}</p>
                            <p className="text-xs text-gray-500">
                              {student?.studentId} · Class {student?.class}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                            p.paymentType === 'online'
                              ? 'bg-red-50 text-primary-700 border border-primary-200'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {p.paymentType === 'online' ? (
                            <>
                              <CreditCard className="w-3 h-3" /> Online
                            </>
                          ) : (
                            'Offline'
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-gray-700">
                        {paymentMethodLabel(p.paymentMethod)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600">{formatDate(p.paymentDate)}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-mono font-bold text-gray-800">
                          {p.receiptNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={p.status === 'verified' || p.status === 'success' ? 'success' : 'slate'}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {whatsappUrl && (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Share receipt via WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDownloadReceipt(p)}
                            className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Download PDF Receipt"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-red-50 transition-colors"
                            title="Delete payment"
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
        title="Record Offline Fee Payment"
        size="lg"
      >
        <AddPaymentForm
          loading={createMutation.isPending}
          onCancel={() => setModalOpen(false)}
          onSave={(fd) => createMutation.mutate(fd)}
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
