import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, SearchInput, Modal, ConfirmDialog, FormField, Select, Badge, EmptyState, Avatar } from '@/components/ui'
import { adminService } from '@/services'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Pencil, Trash2, UserCheck, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const BATCHES = ['Morning', 'Evening', 'Weekend']
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Science']

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Valid phone required'),
  subjects: z.string().optional(),
  batches: z.string().optional(),
  qualification: z.string().optional(),
  salary: z.coerce.number().min(0).optional(),
  address: z.string().optional(),
  password: z.string().min(6).optional().or(z.literal('')),
})

function TeacherForm({ teacher, onSave, onCancel, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: teacher ? {
      name: teacher.name, email: teacher.email, phone: teacher.phone,
      subjects: teacher.subjects?.join(', '),
      batches: teacher.batches?.join(', '),
      qualification: teacher.qualification,
      salary: teacher.salary,
      address: teacher.address,
    } : {},
  })

  const handleSave = (data) => {
    const payload = {
      ...data,
      subjects: data.subjects ? data.subjects.split(',').map(s => s.trim()).filter(Boolean) : [],
      batches: data.batches ? data.batches.split(',').map(s => s.trim()).filter(Boolean) : [],
    }
    onSave(payload)
  }

  return (
    <form onSubmit={handleSubmit(handleSave)} className="p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Full Name" error={errors.name?.message} required>
          <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Teacher full name" />
        </FormField>
        <FormField label="Email" error={errors.email?.message} required>
          <input {...register('email')} type="email" className={`input ${errors.email ? 'input-error' : ''}`} placeholder="Email address" />
        </FormField>
        <FormField label="Phone" error={errors.phone?.message} required>
          <input {...register('phone')} className={`input ${errors.phone ? 'input-error' : ''}`} placeholder="Mobile number" />
        </FormField>
        {!teacher && (
          <FormField label="Password" hint="Default: VMC@1234 if blank">
            <input {...register('password')} type="password" className="input" placeholder="Set password" />
          </FormField>
        )}
        <FormField label="Subjects" hint="Comma-separated e.g. Mathematics, Physics">
          <input {...register('subjects')} className="input" placeholder="Mathematics, Physics" />
        </FormField>
        <FormField label="Batches" hint="Comma-separated e.g. Morning, Evening">
          <input {...register('batches')} className="input" placeholder="Morning, Evening" />
        </FormField>
        <FormField label="Qualification">
          <input {...register('qualification')} className="input" placeholder="e.g. M.Sc Mathematics" />
        </FormField>
        <FormField label="Monthly Salary (₹)">
          <input {...register('salary')} type="number" className="input" placeholder="e.g. 25000" />
        </FormField>
        <FormField label="Address" className="sm:col-span-2">
          <textarea {...register('address')} className="input resize-none" rows={2} placeholder="Home address" />
        </FormField>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : teacher ? 'Update Teacher' : 'Add Teacher'}
        </button>
      </div>
    </form>
  )
}

export default function ManageTeachers() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers', search],
    queryFn: () => adminService.getTeachers({ search: search || undefined }),
  })

  const createMutation = useMutation({
    mutationFn: adminService.createTeacher,
    onSuccess: () => { qc.invalidateQueries(['teachers']); setModalOpen(false); toast.success('Teacher added') },
    onError: err => toast.error(err.response?.data?.message || 'Failed to add teacher'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateTeacher(id, data),
    onSuccess: () => { qc.invalidateQueries(['teachers']); setModalOpen(false); setEditing(null); toast.success('Teacher updated') },
    onError: err => toast.error(err.response?.data?.message || 'Failed to update teacher'),
  })

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteTeacher,
    onSuccess: () => { qc.invalidateQueries(['teachers']); setDeleteTarget(null); toast.success('Teacher deactivated') },
    onError: err => toast.error(err.response?.data?.message || 'Failed'),
  })

  return (
    <Sidebar>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Teachers</h1>
          <p className="page-subtitle">{teachers.length} teachers on staff</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Add Teacher
        </button>
      </div>

      <div className="card p-4 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, ID, email…" className="max-w-sm" />
      </div>

      <div className="table-container">
        {isLoading ? <PageLoader /> : teachers.length === 0 ? (
          <EmptyState icon={UserCheck} title="No teachers found" description="Add your first teacher to get started" />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Subjects</th>
                <th>Batches</th>
                <th>Qualification</th>
                <th>Salary</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(t => (
                <tr key={t._id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={t.name} size="sm" />
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{t.name}</p>
                        <p className="text-xs text-slate-500">{t.teacherId} · {t.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {(t.subjects || []).slice(0, 2).map(s => (
                        <span key={s} className="badge badge-blue text-xs">{s}</span>
                      ))}
                      {t.subjects?.length > 2 && <span className="badge badge-slate">+{t.subjects.length - 2}</span>}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {(t.batches || []).map(b => (
                        <span key={b} className="badge badge-slate text-xs">{b}</span>
                      ))}
                    </div>
                  </td>
                  <td><p className="text-sm text-slate-700">{t.qualification || '—'}</p></td>
                  <td><p className="text-sm text-slate-700">{t.salary ? formatCurrency(t.salary) + '/mo' : '—'}</p></td>
                  <td>
                    <Badge variant={t.status === 'active' ? 'green' : 'red'}>{t.status}</Badge>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditing(t); setModalOpen(true) }} className="btn btn-ghost btn-sm p-1.5"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteTarget(t)} className="btn btn-ghost btn-sm p-1.5 text-red-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? 'Edit Teacher' : 'Add New Teacher'} size="lg">
        <TeacherForm
          teacher={editing}
          loading={createMutation.isPending || updateMutation.isPending}
          onCancel={() => { setModalOpen(false); setEditing(null) }}
          onSave={data => editing ? updateMutation.mutate({ id: editing._id, data }) : createMutation.mutate(data)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        loading={deleteMutation.isPending}
        title="Deactivate Teacher"
        message={`Deactivate ${deleteTarget?.name}? They will lose portal access.`}
        confirmText="Deactivate"
        danger
      />
    </Sidebar>
  )
}
