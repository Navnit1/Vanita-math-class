import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import {
  PageLoader, SearchInput, Modal, ConfirmDialog, FormField, Select,
  Badge, Pagination, EmptyState, Avatar
} from '@/components/ui'
import { studentService, paymentService } from '@/services'
import { formatCurrency, formatDate, feeStatusBadge, cn } from '@/lib/utils'
import {
  Plus, Pencil, Trash2, Users, Loader2, Copy, Download,
  CheckCircle2, KeyRound, CreditCard, UserCheck, ShieldAlert,
  Power, Check, Phone, Eye, Calendar, Clock
} from 'lucide-react'
import toast from 'react-hot-toast'

const CLASSES = ['8th', '9th', '10th', '+1', '+2']
const BATCHES = ['Evening', 'Morning', 'Weekend']
const FEE_PLANS = ['monthly', 'quarterly', 'yearly']

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().min(10, 'Enter a valid 10-digit mobile number'),
  class: z.string().min(1, 'Select class / standard'),
  batch: z.string().min(1, 'Select batch'),
  school: z.string().optional(),
  academicYear: z.string().min(4, 'Enter academic year'),
  admissionDate: z.string().optional(),
  parentName: z.string().min(2, 'Parent name is required'),
  parentPhone: z.string().min(10, 'Enter parent phone number'),
  monthlyFee: z.coerce.number().min(0),
  totalFee: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).optional(),
  feePlan: z.string().min(1),
  course: z.string().optional(),
  address: z.string().optional(),
})

function StudentForm({ student, onSave, onCancel, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: student ? {
      name: student.fullName,
      email: student.email,
      phone: student.phone,
      class: student.class,
      batch: student.batch,
      school: student.school || '',
      academicYear: student.academicYear,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      monthlyFee: student.monthlyFee || 0,
      totalFee: student.totalFee || 0,
      discount: student.discount || 0,
      feePlan: student.feePlan || 'monthly',
      course: student.course || 'Mathematics',
      address: student.address || '',
      admissionDate: student.admissionDate ? new Date(student.admissionDate).toISOString().slice(0, 10) : '',
    } : {
      class: '10th',
      batch: 'Evening',
      monthlyFee: 2500,
      totalFee: 25000,
      discount: 0,
      feePlan: 'monthly',
      academicYear: String(new Date().getFullYear()),
      admissionDate: new Date().toISOString().slice(0, 10),
      course: 'Mathematics',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-4">
      {!student && (
        <div className="bg-[#FFF5F5] border border-[#FFCCD0] text-[#C90019] text-xs p-3.5 rounded-xl flex items-start gap-2.5 font-medium">
          <KeyRound className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            A unique Roll Number (Student ID), username, and temporary password will be created automatically. The student will be required to set a new password on their first login.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Student Full Name" error={errors.name?.message} required>
          <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="e.g. Jaspreet Singh" />
        </FormField>

        <FormField label="Email" error={errors.email?.message} hint="Optional — for OTP password recovery">
          <input {...register('email')} type="email" className={`input ${errors.email ? 'input-error' : ''}`} placeholder="student@example.com" />
        </FormField>

        <FormField label="Student Mobile" error={errors.phone?.message} required>
          <input {...register('phone')} className={`input ${errors.phone ? 'input-error' : ''}`} placeholder="10-digit mobile number" />
        </FormField>

        <FormField label="Class / Standard" error={errors.class?.message} required>
          <Select {...register('class')} className={errors.class ? 'input-error' : ''}>
            {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
          </Select>
        </FormField>

        <FormField label="Batch Timing" error={errors.batch?.message} required>
          <Select {...register('batch')} className={errors.batch ? 'input-error' : ''}>
            {BATCHES.map(b => <option key={b} value={b}>{b} Batch</option>)}
          </Select>
        </FormField>

        <FormField label="School Name" error={errors.school?.message}>
          <input {...register('school')} className="input" placeholder="e.g. St. Joseph Convent School" />
        </FormField>

        <FormField label="Parent / Guardian Name" error={errors.parentName?.message} required>
          <input {...register('parentName')} className={`input ${errors.parentName ? 'input-error' : ''}`} placeholder="Parent full name" />
        </FormField>

        <FormField label="Parent Phone" error={errors.parentPhone?.message} required>
          <input {...register('parentPhone')} className={`input ${errors.parentPhone ? 'input-error' : ''}`} placeholder="Parent mobile number" />
        </FormField>

        <FormField label="Monthly Tuition Fee (₹)" error={errors.monthlyFee?.message} required>
          <input {...register('monthlyFee')} type="number" min="0" className="input" />
        </FormField>

        <FormField label="Total Academic Year Fee (₹)" error={errors.totalFee?.message} required>
          <input {...register('totalFee')} type="number" min="0" className="input" />
        </FormField>

        <FormField label="Scholarship / Discount (₹)" error={errors.discount?.message}>
          <input {...register('discount')} type="number" min="0" className="input" />
        </FormField>

        <FormField label="Admission Date" error={errors.admissionDate?.message}>
          <input {...register('admissionDate')} type="date" className="input" />
        </FormField>
      </div>

      <FormField label="Address / Locality (Bathinda)">
        <input {...register('address')} className="input" placeholder="e.g. #302, Phase-II, Vishal Nagar, Bathinda" />
      </FormField>

      <div className="flex gap-3 justify-end pt-4 border-t border-[#D9DDE3]">
        <button type="button" onClick={onCancel} className="btn btn-secondary btn-sm">Cancel</button>
        <button type="submit" disabled={loading} className="btn btn-primary btn-sm font-semibold shadow-red-glow">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />Saving…</> : student ? 'Update Student' : 'Enroll Student'}
        </button>
      </div>
    </form>
  )
}

export default function ManageStudents() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedClass, setSelectedClass] = useState(searchParams.get('class') || '')
  const [selectedBatch, setSelectedBatch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('active')
  const [selectedFeeStatus, setSelectedFeeStatus] = useState('')

  const [modalOpen, setModalOpen] = useState(searchParams.get('action') === 'new')
  const [editingStudent, setEditingStudent] = useState(null)
  const [viewingStudent, setViewingStudent] = useState(null)
  const [credentialsModal, setCredentialsModal] = useState(null)
  const [copied, setCopied] = useState(false)
  const [deactivateTarget, setDeactivateTarget] = useState(null)

  // Direct Quick Payment Modal
  const [recordFeeTarget, setRecordFeeTarget] = useState(null)
  const [feeAmount, setFeeAmount] = useState('')
  const [feeMethod, setFeeMethod] = useState('cash')

  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['students', page, search, selectedClass, selectedBatch, selectedStatus, selectedFeeStatus],
    queryFn: () => studentService.getAll({
      page,
      limit: 15,
      search: search || undefined,
      class: selectedClass || undefined,
      batch: selectedBatch || undefined,
      status: selectedStatus || undefined,
      feeStatus: selectedFeeStatus || undefined,
    }),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: studentService.create,
    onSuccess: (res) => {
      qc.invalidateQueries(['students'])
      qc.invalidateQueries(['admin-dashboard'])
      setModalOpen(false)
      if (res.credentials) setCredentialsModal(res.credentials)
      toast.success('Student enrolled successfully!')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to create student'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => studentService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['students'])
      qc.invalidateQueries(['admin-dashboard'])
      setEditingStudent(null)
      toast.success('Student updated successfully!')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to update student'),
  })

  const toggleStatusMutation = useMutation({
    mutationFn: studentService.toggleStatus,
    onSuccess: (res) => {
      qc.invalidateQueries(['students'])
      qc.invalidateQueries(['admin-dashboard'])
      setDeactivateTarget(null)
      toast.success(res.message || 'Student status updated!')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to update status'),
  })

  const resetPasswordMutation = useMutation({
    mutationFn: studentService.adminResetPassword,
    onSuccess: (res) => {
      setCredentialsModal(res.data)
      toast.success('Temporary password generated!')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to reset password'),
  })

  const recordFeeMutation = useMutation({
    mutationFn: paymentService.create,
    onSuccess: (res) => {
      qc.invalidateQueries(['students'])
      qc.invalidateQueries(['admin-dashboard'])
      setRecordFeeTarget(null)
      setFeeAmount('')
      toast.success(`Fee payment recorded! Receipt: ${res.receiptNumber}`)
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to record fee'),
  })

  const handleExportCsv = async () => {
    try {
      toast.loading('Generating student CSV…', { id: 'csv-export' })
      await studentService.exportCsv({
        class: selectedClass || undefined,
        batch: selectedBatch || undefined,
        status: selectedStatus || undefined,
      })
      toast.success('Students directory CSV downloaded!', { id: 'csv-export' })
    } catch {
      toast.error('Failed to export CSV', { id: 'csv-export' })
    }
  }

  const copyCreds = (creds) => {
    const text = `Vanita Math Classes Login Credentials\nRoll Number: ${creds.studentId}\nUsername: ${creds.username}\nTemporary Password: ${creds.password || creds.temporaryPassword}\nPortal: ${window.location.origin}/login`
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Credentials copied to clipboard')
    setTimeout(() => setCopied(false), 2500)
  }

  const students = data?.students || []
  const total = data?.total || 0
  const pages = data?.pages || 1

  return (
    <Sidebar>
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Student Directory</h1>
          <p className="page-subtitle">
            {total} enrolled students. Manage profiles, track fees, and handle admissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="btn btn-secondary btn-sm flex items-center gap-1.5 font-semibold text-xs"
            title="Export student directory to CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#E50914]" />
            Export CSV
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="btn btn-primary btn-sm flex items-center gap-1.5 font-semibold text-xs shadow-red-glow"
          >
            <Plus className="w-4 h-4" />
            Add New Student
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card p-4 mb-5 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <SearchInput
            value={search}
            onChange={v => { setSearch(v); setPage(1) }}
            placeholder="Search by name, roll no, phone, parent…"
          />
        </div>

        <Select
          value={selectedClass}
          onChange={e => { setSelectedClass(e.target.value); setPage(1) }}
          className="w-36 text-xs"
        >
          <option value="">All Standards</option>
          {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
        </Select>

        <Select
          value={selectedBatch}
          onChange={e => { setSelectedBatch(e.target.value); setPage(1) }}
          className="w-36 text-xs"
        >
          <option value="">All Batches</option>
          {BATCHES.map(b => <option key={b} value={b}>{b} Batch</option>)}
        </Select>

        <Select
          value={selectedFeeStatus}
          onChange={e => { setSelectedFeeStatus(e.target.value); setPage(1) }}
          className="w-36 text-xs"
        >
          <option value="">All Fee Statuses</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="paid">Fully Paid</option>
          <option value="overdue">Overdue</option>
        </Select>

        <Select
          value={selectedStatus}
          onChange={e => { setSelectedStatus(e.target.value); setPage(1) }}
          className="w-32 text-xs"
        >
          <option value="">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Deactivated</option>
        </Select>
      </div>

      {/* Students Directory Table */}
      {isLoading ? (
        <PageLoader />
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students found"
          description="Try adjusting your search criteria or add a new student using the button above."
        />
      ) : (
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Roll No / Student</th>
                  <th>Class & Batch</th>
                  <th>Parent Contact</th>
                  <th>Monthly Fee</th>
                  <th>Fee Dues</th>
                  <th>Status</th>
                  <th>Admission Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => {
                  const pendingBalance = Math.max(0, (s.totalFee || 0) - (s.paidFee || 0))
                  const isActive = s.status === 'active'

                  return (
                    <tr key={s._id} className={cn(!isActive && 'opacity-60 bg-[#FAFAFA]')}>
                      {/* Student info */}
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={s.fullName} src={s.profilePhoto} size="sm" />
                          <div className="min-w-0">
                            <p className="font-bold text-[#171717] leading-tight truncate">
                              {s.fullName}
                            </p>
                            <p className="font-mono text-xs font-semibold text-[#E50914] mt-0.5">
                              {s.studentId}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Class & Batch */}
                      <td>
                        <Badge variant="primary">Class {s.class}</Badge>
                        <p className="text-xs text-[#64748B] mt-0.5">{s.batch} Batch</p>
                      </td>

                      {/* Parent Contact */}
                      <td>
                        <p className="text-xs font-medium text-[#171717]">{s.parentName || '—'}</p>
                        <a
                          href={`tel:${s.parentPhone || s.phone}`}
                          className="text-xs text-[#E50914] hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="w-3 h-3" />
                          {s.parentPhone || s.phone || '—'}
                        </a>
                      </td>

                      {/* Monthly Fee */}
                      <td>
                        <span className="font-semibold text-xs text-[#171717]">
                          {formatCurrency(s.monthlyFee || 0)}
                        </span>
                        <p className="text-[10px] text-[#64748B]">per month</p>
                      </td>

                      {/* Dues & Status */}
                      <td>
                        <Badge variant={feeStatusBadge(s.feeStatus)} className="capitalize">
                          {s.feeStatus || 'pending'}
                        </Badge>
                        {pendingBalance > 0 ? (
                          <p className="text-xs font-bold text-[#C90019] mt-0.5">
                            Due: {formatCurrency(pendingBalance)}
                          </p>
                        ) : (
                          <p className="text-[10px] font-semibold text-[#059669] mt-0.5">Cleared</p>
                        )}
                      </td>

                      {/* Active Status */}
                      <td>
                        <Badge variant={isActive ? 'green' : 'slate'}>
                          {isActive ? 'Active' : 'Deactivated'}
                        </Badge>
                      </td>

                      {/* Admission Date */}
                      <td className="text-xs text-[#64748B]">
                        {formatDate(s.admissionDate)}
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <button
                            onClick={() => setViewingStudent(s)}
                            className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F3F4F6] hover:text-[#171717]"
                            title="View student profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Record Fee Shortcut */}
                          <button
                            onClick={() => {
                              setRecordFeeTarget(s)
                              setFeeAmount(pendingBalance > 0 ? String(s.monthlyFee || pendingBalance) : '2500')
                            }}
                            className="p-1.5 rounded-lg text-[#059669] hover:bg-emerald-50 hover:text-emerald-700"
                            title="Record fee payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => setEditingStudent(s)}
                            className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F3F4F6] hover:text-[#171717]"
                            title="Edit student"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Admin Password Reset */}
                          <button
                            onClick={() => resetPasswordMutation.mutate(s._id)}
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50"
                            title="Reset student password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Deactivate / Reactivate (Preserves records) */}
                          <button
                            onClick={() => setDeactivateTarget(s)}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors',
                              isActive
                                ? 'text-[#C90019] hover:bg-[#FFF5F5]'
                                : 'text-[#059669] hover:bg-emerald-50'
                            )}
                            title={isActive ? 'Deactivate student (preserve records)' : 'Reactivate student'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pages={pages} onPage={p => setPage(p)} />
        </div>
      )}

      {/* CREATE STUDENT MODAL */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Enroll New Student" size="lg">
        <StudentForm
          onSave={data => createMutation.mutate(data)}
          onCancel={() => setModalOpen(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* EDIT STUDENT MODAL */}
      <Modal isOpen={!!editingStudent} onClose={() => setEditingStudent(null)} title="Edit Student Profile" size="lg">
        {editingStudent && (
          <StudentForm
            student={editingStudent}
            onSave={data => updateMutation.mutate({ id: editingStudent._id, data })}
            onCancel={() => setEditingStudent(null)}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* VIEW STUDENT PROFILE MODAL */}
      <Modal isOpen={!!viewingStudent} onClose={() => setViewingStudent(null)} title="Student Profile" size="md">
        {viewingStudent && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-[#D9DDE3]">
              <Avatar name={viewingStudent.fullName} src={viewingStudent.profilePhoto} size="lg" />
              <div>
                <h3 className="font-extrabold text-base text-[#171717]">{viewingStudent.fullName}</h3>
                <p className="font-mono text-xs font-bold text-[#E50914]">{viewingStudent.studentId}</p>
                <p className="text-xs text-[#64748B]">Class {viewingStudent.class} · {viewingStudent.batch} Batch</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#FAFAFA] border border-[#D9DDE3] rounded-lg">
                <span className="text-[#64748B] block">Parent Name:</span>
                <span className="font-bold text-[#171717]">{viewingStudent.parentName || '—'}</span>
              </div>
              <div className="p-3 bg-[#FAFAFA] border border-[#D9DDE3] rounded-lg">
                <span className="text-[#64748B] block">Parent Phone:</span>
                <a href={`tel:${viewingStudent.parentPhone}`} className="font-bold text-[#E50914] hover:underline">
                  {viewingStudent.parentPhone || '—'}
                </a>
              </div>
              <div className="p-3 bg-[#FAFAFA] border border-[#D9DDE3] rounded-lg">
                <span className="text-[#64748B] block">Monthly Tuition Fee:</span>
                <span className="font-bold text-[#171717]">{formatCurrency(viewingStudent.monthlyFee || 0)}</span>
              </div>
              <div className="p-3 bg-[#FAFAFA] border border-[#D9DDE3] rounded-lg">
                <span className="text-[#64748B] block">Outstanding Balance:</span>
                <span className="font-bold text-[#C90019]">
                  {formatCurrency(Math.max(0, (viewingStudent.totalFee || 0) - (viewingStudent.paidFee || 0)))}
                </span>
              </div>
            </div>

            {viewingStudent.school && (
              <p className="text-xs text-[#64748B]">
                School: <strong className="text-[#171717]">{viewingStudent.school}</strong>
              </p>
            )}

            {viewingStudent.address && (
              <p className="text-xs text-[#64748B]">
                Address: <strong className="text-[#171717]">{viewingStudent.address}</strong>
              </p>
            )}

            <div className="flex gap-2 justify-end pt-3 border-t border-[#D9DDE3]">
              <button onClick={() => setViewingStudent(null)} className="btn btn-secondary btn-sm">Close</button>
              <button
                onClick={() => {
                  setEditingStudent(viewingStudent)
                  setViewingStudent(null)
                }}
                className="btn btn-primary btn-sm"
              >
                Edit Details
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* DEACTIVATE / REACTIVATE CONFIRMATION (PRESERVES HISTORICAL RECORDS) */}
      <ConfirmDialog
        isOpen={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => toggleStatusMutation.mutate(deactivateTarget._id)}
        title={deactivateTarget?.status === 'active' ? 'Deactivate Student Account?' : 'Reactivate Student Account?'}
        message={
          deactivateTarget?.status === 'active'
            ? `Are you sure you want to deactivate ${deactivateTarget?.fullName}? All historical fee payments, attendance, and weekly test results will be SAFELY PRESERVED in the database. The student will not be able to log in while deactivated.`
            : `Reactivate ${deactivateTarget?.fullName}? The student will be restored to active status and permitted to log in.`
        }
        confirmText={deactivateTarget?.status === 'active' ? 'Deactivate Student' : 'Reactivate Student'}
        danger={deactivateTarget?.status === 'active'}
        loading={toggleStatusMutation.isPending}
      />

      {/* QUICK RECORD FEE MODAL */}
      <Modal
        isOpen={!!recordFeeTarget}
        onClose={() => setRecordFeeTarget(null)}
        title={`Record Tuition Fee: ${recordFeeTarget?.fullName}`}
        size="sm"
      >
        <div className="p-6 space-y-4">
          <div className="p-3 bg-[#FAFAFA] border border-[#D9DDE3] rounded-xl text-xs space-y-1">
            <p>Roll No: <strong>{recordFeeTarget?.studentId}</strong></p>
            <p>Class: <strong>Class {recordFeeTarget?.class} ({recordFeeTarget?.batch})</strong></p>
            <p>
              Pending Dues:{' '}
              <strong className="text-[#C90019]">
                {formatCurrency(Math.max(0, (recordFeeTarget?.totalFee || 0) - (recordFeeTarget?.paidFee || 0)))}
              </strong>
            </p>
          </div>

          <FormField label="Amount to Record (₹)" required>
            <input
              type="number"
              min="1"
              value={feeAmount}
              onChange={e => setFeeAmount(e.target.value)}
              className="input font-bold text-base text-[#171717]"
              autoFocus
            />
          </FormField>

          <FormField label="Payment Method" required>
            <Select value={feeMethod} onChange={e => setFeeMethod(e.target.value)}>
              <option value="cash">Cash Payment</option>
              <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
              <option value="bank_transfer">Bank Transfer / NEFT</option>
              <option value="cheque">Cheque</option>
            </Select>
          </FormField>

          <div className="flex gap-3 justify-end pt-3 border-t border-[#D9DDE3]">
            <button onClick={() => setRecordFeeTarget(null)} className="btn btn-secondary btn-sm">Cancel</button>
            <button
              onClick={() => {
                if (!feeAmount || Number(feeAmount) < 1) {
                  toast.error('Please enter a valid amount')
                  return
                }
                recordFeeMutation.mutate({
                  studentId: recordFeeTarget._id,
                  amount: Number(feeAmount),
                  paymentMethod: feeMethod,
                  month: new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
                })
              }}
              disabled={recordFeeMutation.isPending}
              className="btn btn-primary btn-sm font-semibold shadow-red-glow"
            >
              {recordFeeMutation.isPending ? 'Recording…' : 'Record & Generate Receipt'}
            </button>
          </div>
        </div>
      </Modal>

      {/* CREDENTIALS SUCCESS MODAL */}
      <Modal isOpen={!!credentialsModal} onClose={() => setCredentialsModal(null)} title="Student Credentials" size="sm">
        <div className="p-6 space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-2 text-[#059669]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-[#171717]">Credentials Ready</h3>
            <p className="text-xs text-[#64748B] mt-0.5">Please share these details with the student.</p>
          </div>

          <div className="bg-[#F3F4F6] border border-[#D9DDE3] rounded-xl p-3.5 space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-[#D9DDE3]">
              <span className="text-[#64748B]">Roll No:</span>
              <strong className="text-[#171717]">{credentialsModal?.studentId}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[#D9DDE3]">
              <span className="text-[#64748B]">Username:</span>
              <strong className="text-[#171717]">{credentialsModal?.username}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#64748B]">Password:</span>
              <strong className="text-[#C90019]">{credentialsModal?.password || credentialsModal?.temporaryPassword}</strong>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => copyCreds(credentialsModal)}
              className="btn btn-primary flex-1 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy Credentials'}
            </button>
            <button onClick={() => setCredentialsModal(null)} className="btn btn-secondary btn-sm text-xs">
              Close
            </button>
          </div>
        </div>
      </Modal>
    </Sidebar>
  )
}
