import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, SearchInput, Modal, ConfirmDialog, FormField, Select, Badge, Pagination, EmptyState, Avatar } from '@/components/ui'
import { studentService } from '@/services'
import { Plus, Pencil, Trash2, Users, Loader2, Copy, Printer, Download, CheckCircle2, KeyRound, CreditCard, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import StudentIdCard from '@/components/shared/StudentIdCard'

const CLASSES = [ '8th', '9th', '10th','11th', '12th' ]
const BATCHES = ['Morning', 'Evening', 'Weekend']
const SECTIONS = ['A', 'B', 'C', '']
const FEE_PLANS = ['monthly', 'quarterly', 'yearly']

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().min(10, 'Enter a valid phone number'),
  class: z.string().min(1, 'Select standard'),
  section: z.string().optional(),
  batch: z.string().min(1, 'Select batch'),
  academicYear: z.string().min(4, 'Enter academic year'),
  admissionDate: z.string().optional(),
  parentName: z.string().min(2, 'Parent name is required'),
  parentPhone: z.string().min(10, 'Enter parent phone number'),
  totalFee: z.coerce.number().min(0),
  feePlan: z.string().min(1),
  course: z.string().optional(),
  address: z.string().optional(),
})

function StudentForm({ student, onSave, onCancel, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: student ? {
      name: student.fullName, email: student.email, phone: student.phone,
      class: student.class, section: student.section, batch: student.batch,
      academicYear: student.academicYear, parentName: student.parentName,
      parentPhone: student.parentPhone, totalFee: student.totalFee,
      feePlan: student.feePlan || 'monthly',
      course: student.course, address: student.address,
    } : { totalFee: 0, feePlan: 'monthly', academicYear: String(new Date().getFullYear()) },
  })

  return (
    <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-4">
      {!student && (
        <div className="bg-primary-50 border border-primary-200 text-primary-800 text-sm px-4 py-3 rounded-lg flex items-start gap-2.5">
          <KeyRound className="w-4 h-4 mt-0.5 shrink-0" />
          <span>A Student ID, username, and temporary password will be generated automatically. The student must change this password on first login.</span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Full Name" error={errors.name?.message} required>
          <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Student full name" />
        </FormField>
        <FormField label="Email" error={errors.email?.message} hint="Optional — leave blank if the student has none">
          <input {...register('email')} type="email" className={`input ${errors.email ? 'input-error' : ''}`} placeholder="Email address (optional)" />
        </FormField>
        <FormField label="Phone" error={errors.phone?.message} required>
          <input {...register('phone')} className={`input ${errors.phone ? 'input-error' : ''}`} placeholder="Mobile number" />
        </FormField>
        <FormField label="Standard" error={errors.class?.message} required>
          <Select {...register('class')} className={errors.class ? 'input-error' : ''}>
            <option value="">Select standard</option>
            {CLASSES.map(c => <option key={c}>{c}</option>)}
          </Select>
        </FormField>
        <FormField label="Section" error={errors.section?.message}>
          <Select {...register('section')}>
            <option value="">No section</option>
            {SECTIONS.filter(Boolean).map(s => <option key={s}>{s}</option>)}
          </Select>
        </FormField>
        <FormField label="Batch" error={errors.batch?.message} required>
          <Select {...register('batch')} className={errors.batch ? 'input-error' : ''}>
            <option value="">Select batch</option>
            {BATCHES.map(b => <option key={b}>{b}</option>)}
          </Select>
        </FormField>
        <FormField label="Academic Year" error={errors.academicYear?.message} required>
          <input {...register('academicYear')} className={`input ${errors.academicYear ? 'input-error' : ''}`} placeholder="2026" />
        </FormField>
        <FormField label="Admission Date" error={errors.admissionDate?.message}>
          <input {...register('admissionDate')} type="date" className="input" />
        </FormField>
        <FormField label="Course" error={errors.course?.message}>
          <input {...register('course')} className="input" placeholder="e.g. Foundation Mathematics" />
        </FormField>
        <FormField label="Parent / Guardian Name" error={errors.parentName?.message} required>
          <input {...register('parentName')} className={`input ${errors.parentName ? 'input-error' : ''}`} placeholder="Parent / guardian name" />
        </FormField>
        <FormField label="Parent Phone" error={errors.parentPhone?.message} required>
          <input {...register('parentPhone')} className={`input ${errors.parentPhone ? 'input-error' : ''}`} placeholder="Parent phone number" />
        </FormField>
        <FormField label="Fee Plan" error={errors.feePlan?.message} required>
          <Select {...register('feePlan')}>
            {FEE_PLANS.map(p => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
          </Select>
        </FormField>
        <FormField label="Total Fee (₹)" error={errors.totalFee?.message} required>
          <input {...register('totalFee')} type="number" className="input" placeholder="e.g. 36000" />
        </FormField>
        <FormField label="Address" error={errors.address?.message} className="sm:col-span-2">
          <textarea {...register('address')} className="input resize-none" rows={2} placeholder="Home address (optional)" />
        </FormField>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : (student ? 'Update Student' : 'Add Student')}
        </button>
      </div>
    </form>
  )
}

function CredentialsModal({ credentials, student, onClose }) {
  const printRef = useRef(null)
  if (!credentials) return null

  const copyAll = () => {
    const text = `Vanita Math Classes — Student Login Credentials\n\nStudent: ${student?.fullName}\nStudent ID: ${credentials.studentId}\nUsername: ${credentials.username}\nTemporary Password: ${credentials.password}\n\nPlease change this password on first login.`
    navigator.clipboard.writeText(text)
    toast.success('Credentials copied to clipboard')
  }

  const downloadTxt = () => {
    const text = `Vanita Math Classes — Student Login Credentials\n\nStudent: ${student?.fullName}\nStudent ID: ${credentials.studentId}\nUsername: ${credentials.username}\nTemporary Password: ${credentials.password}\n\nPlease change this password on first login.`
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${credentials.studentId}-credentials.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const printCard = () => {
    const w = window.open('', '_blank', 'width=500,height=400')
    w.document.write(`
      <html><head><title>Student Credentials</title>
      <style>
        body { font-family: -apple-system, sans-serif; padding: 32px; }
        h2 { margin: 0 0 4px; }
        .sub { color: #64748b; font-size: 13px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
        td:first-child { color: #64748b; font-size: 13px; width: 160px; }
        td:last-child { font-family: monospace; font-size: 15px; font-weight: 600; }
        .note { margin-top: 20px; font-size: 12px; color: #94a3b8; }
      </style></head><body>
        <h2>Vanita Math Classes</h2>
        <p class="sub">Student Login Credentials</p>
        <table>
          <tr><td>Student Name</td><td>${student?.fullName || ''}</td></tr>
          <tr><td>Student ID</td><td>${credentials.studentId}</td></tr>
          <tr><td>Username</td><td>${credentials.username}</td></tr>
          <tr><td>Temporary Password</td><td>${credentials.password}</td></tr>
        </table>
        <p class="note">Login with your Student ID, username, or email. You will be asked to set a new password on first login.</p>
      </body></html>
    `)
    w.document.close()
    w.print()
  }

  return (
    <Modal isOpen={!!credentials} onClose={onClose} title="Student account created" size="md">
      <div className="p-6">
        <div className="flex items-center gap-2.5 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-5 text-sm">
          <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
          <span>{student?.fullName}'s account is ready. Share these credentials securely — they won't be shown again.</span>
        </div>

        <div ref={printRef} className="space-y-3 bg-slate-50 rounded-xl p-5 border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Student ID</span>
            <span className="font-mono font-semibold text-slate-900">{credentials.studentId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Username</span>
            <span className="font-mono font-semibold text-slate-900">{credentials.username}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Temporary Password</span>
            <span className="font-mono font-semibold text-slate-900">{credentials.password}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-5">
          <button onClick={copyAll} className="btn btn-secondary justify-center text-sm"><Copy className="w-3.5 h-3.5" />Copy</button>
          <button onClick={printCard} className="btn btn-secondary justify-center text-sm"><Printer className="w-3.5 h-3.5" />Print</button>
          <button onClick={downloadTxt} className="btn btn-secondary justify-center text-sm"><Download className="w-3.5 h-3.5" />Download</button>
        </div>

        <button onClick={onClose} className="btn btn-primary w-full mt-4">Done</button>
      </div>
    </Modal>
  )
}

export default function ManageStudents() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [filterBatch, setFilterBatch] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterStatus, setFilterStatus] = useState('active')
  const [newCredentials, setNewCredentials] = useState(null)
  const [newStudent, setNewStudent] = useState(null)
  const [idCardTarget, setIdCardTarget] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['students', page, search, filterBatch, filterClass, filterStatus],
    queryFn: () => studentService.getAll({ page, limit: 15, search: search || undefined, batch: filterBatch || undefined, class: filterClass || undefined, status: filterStatus || undefined }),
    placeholderData: (prev) => prev,
  })

  const createMutation = useMutation({
    mutationFn: studentService.create,
    onSuccess: (result) => {
      qc.invalidateQueries(['students'])
      setModalOpen(false)
      toast.success('Student added')
      if (result?.credentials) {
        setNewCredentials(result.credentials)
        setNewStudent(result.student)
      }
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to add student'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => studentService.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['students']); setModalOpen(false); setEditing(null); toast.success('Student updated') },
    onError: err => toast.error(err.response?.data?.message || 'Failed to update student'),
  })

  const deleteMutation = useMutation({
    mutationFn: studentService.delete,
    onSuccess: () => { qc.invalidateQueries(['students']); setDeleteTarget(null); toast.success('Student deactivated') },
    onError: err => toast.error(err.response?.data?.message || 'Failed'),
  })

  const approveMutation = useMutation({
    mutationFn: studentService.approve,
    onSuccess: () => { qc.invalidateQueries(['students']); toast.success('Student approved — they can now log in') },
    onError: err => toast.error(err.response?.data?.message || 'Failed to approve student'),
  })

  const students = data?.students || []
  const total = data?.total || 0
  const pages = data?.pages || 1
  const pendingCount = students.filter(s => s.accountStatus === 'pending').length

  return (
    <Sidebar>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{total} students total</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      {pendingCount > 0 && (
        <div className="mb-4 flex items-center gap-2.5 text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
          <UserCheck className="w-4.5 h-4.5 shrink-0" />
          <span>{pendingCount} student{pendingCount > 1 ? 's' : ''} self-registered and {pendingCount > 1 ? 'are' : 'is'} waiting for approval — they can't log in until you approve them below.</span>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search by name, ID, username, email…" className="flex-1 min-w-48" />
        <Select value={filterClass} onChange={e => { setFilterClass(e.target.value); setPage(1) }} className="w-36">
          <option value="">All Standards</option>
          {CLASSES.map(c => <option key={c}>{c}</option>)}
        </Select>
        <Select value={filterBatch} onChange={e => { setFilterBatch(e.target.value); setPage(1) }} className="w-40">
          <option value="">All Batches</option>
          {BATCHES.map(b => <option key={b}>{b}</option>)}
        </Select>
        <Select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }} className="w-36">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      {/* Table */}
      <div className="table-container">
        {isLoading ? <PageLoader /> : students.length === 0 ? (
          <EmptyState icon={Users} title="No students found" description="Add a student or adjust your filters" />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Standard / Batch</th>
                <th>Parent</th>
                <th>Fee Status</th>
                <th>Progress</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s._id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={s.fullName} size="sm" />
                      <div>
                        <p className="font-medium text-slate-900 text-sm flex items-center gap-1.5">
                          {s.fullName}
                          {s.accountStatus === 'pending' && <Badge variant="yellow">Pending approval</Badge>}
                         {s.status === 'inactive' && <Badge variant="slate">Deactivated</Badge>}
                        </p>
                        <p className="text-xs text-slate-500">{s.studentId}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="text-sm text-slate-800">{s.class}{s.section ? ` - ${s.section}` : ''}</p>
                    <p className="text-xs text-slate-500">{s.batch} batch</p>
                  </td>
                  <td>
                    <p className="text-sm text-slate-700">{s.parentName || '—'}</p>
                    <p className="text-xs text-slate-500">{s.parentPhone || ''}</p>
                  </td>
                  <td>
                    <Badge variant={s.feeStatus === 'paid' ? 'green' : s.feeStatus === 'partial' ? 'yellow' : s.feeStatus === 'overdue' ? 'red' : 'slate'}>
                      {s.feeStatus}
                    </Badge>
                  </td>
                  <td>
                    <div className="w-28">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>{Math.round((s.paidFee / (s.totalFee || 1)) * 100)}%</span>
                        <span>{s.paidFee}/{s.totalFee}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-600 rounded-full" style={{ width: `${Math.min(100, (s.paidFee / (s.totalFee || 1)) * 100)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {s.accountStatus === 'pending' && (
                        <button
                          onClick={() => approveMutation.mutate(s._id)}
                          disabled={approveMutation.isPending}
                          className="btn btn-ghost btn-sm p-1.5 text-green-600 hover:text-green-700"
                          title="Approve — let this student log in"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => setIdCardTarget(s)} className="btn btn-ghost btn-sm p-1.5 text-indigo-500 hover:text-indigo-700" title="Generate ID Card"><CreditCard className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { setEditing(s); setModalOpen(true) }} className="btn btn-ghost btn-sm p-1.5"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteTarget(s)} className="btn btn-ghost btn-sm p-1.5 text-red-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} pages={pages} onPage={setPage} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? 'Edit Student' : 'Add New Student'} size="lg">
        <StudentForm
          student={editing}
          loading={createMutation.isPending || updateMutation.isPending}
          onCancel={() => { setModalOpen(false); setEditing(null) }}
          onSave={data => editing ? updateMutation.mutate({ id: editing._id, data }) : createMutation.mutate(data)}
        />
      </Modal>

      <CredentialsModal
        credentials={newCredentials}
        student={newStudent}
        onClose={() => { setNewCredentials(null); setNewStudent(null) }}
      />

      <StudentIdCard
        student={idCardTarget}
        isOpen={!!idCardTarget}
        onClose={() => setIdCardTarget(null)}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        loading={deleteMutation.isPending}
        title="Deactivate Student"
        message={`Are you sure you want to deactivate ${deleteTarget?.fullName}? They will lose access to their account.`}
        confirmText="Deactivate"
        danger
      />
    </Sidebar>
  )
}
