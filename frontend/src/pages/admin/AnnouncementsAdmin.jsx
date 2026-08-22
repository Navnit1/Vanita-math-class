import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, Modal, ConfirmDialog, FormField, Select, Badge, EmptyState } from '@/components/ui'
import { announcementService } from '@/services'
import { formatDateTime, cn } from '@/lib/utils'
import { Bell, Plus, Pencil, Trash2, AlertCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  audience: z.string().min(1, 'Select audience'),
  priority: z.string().min(1, 'Select priority'),
  class: z.string().optional(),
  expiresAt: z.string().optional(),
})

const CLASSES = [ '8th', '9th', '10th','11th', '12th' ]
const PRIORITY_COLORS = { high: 'red', medium: 'yellow', low: 'slate' }
const AUDIENCE_COLORS = { all: 'blue', students: 'green', teachers: 'purple', admin: 'slate' }

function AnnouncementForm({ ann, onSave, onCancel, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: ann ? {
      title: ann.title, content: ann.content, audience: ann.audience,
      priority: ann.priority, class: ann.class || '', expiresAt: ann.expiresAt ? ann.expiresAt.split('T')[0] : '',
    } : { audience: 'all', priority: 'medium', class: '' },
  })

  return (
    <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-4">
      <FormField label="Title" error={errors.title?.message} required>
        <input {...register('title')} className={`input ${errors.title ? 'input-error' : ''}`} placeholder="Announcement title" />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Audience" error={errors.audience?.message} required>
          <Select {...register('audience')}>
            <option value="all">Everyone</option>
            <option value="students">Students only</option>
            <option value="teachers">Teachers only</option>
            <option value="admin">Admin only</option>
          </Select>
        </FormField>
        <FormField label="Priority" error={errors.priority?.message} required>
          <Select {...register('priority')}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
        </FormField>
      </div>
      <FormField label="Standard" hint="Leave blank to show to all standards (only applies when audience includes students)">
        <Select {...register('class')}>
          <option value="">All standards</option>
          {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
      </FormField>
      <FormField label="Content" error={errors.content?.message} required>
        <textarea {...register('content')} className={`input resize-none ${errors.content ? 'input-error' : ''}`} rows={5} placeholder="Write the announcement content…" />
      </FormField>
      <FormField label="Expires At (optional)" hint="Leave blank to keep active indefinitely">
        <input {...register('expiresAt')} type="date" className="input" min={new Date().toISOString().split('T')[0]} />
      </FormField>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{ann ? 'Updating…' : 'Publishing…'}</> : ann ? 'Update' : 'Publish'}
        </button>
      </div>
    </form>
  )
}

export default function AnnouncementsAdmin() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementService.getAll({ limit: 50 }),
  })

  const createMutation = useMutation({
    mutationFn: announcementService.create,
    onSuccess: () => { qc.invalidateQueries(['announcements']); setModalOpen(false); toast.success('Announcement published') },
    onError: err => toast.error(err.response?.data?.message || 'Failed'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => announcementService.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['announcements']); setModalOpen(false); setEditing(null); toast.success('Announcement updated') },
    onError: err => toast.error(err.response?.data?.message || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: announcementService.delete,
    onSuccess: () => { qc.invalidateQueries(['announcements']); setDeleteTarget(null); toast.success('Announcement deleted') },
    onError: err => toast.error(err.response?.data?.message || 'Failed'),
  })

  const announcements = data?.announcements || []

  return (
    <Sidebar>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">{announcements.length} active announcements</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn btn-primary">
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {isLoading ? <PageLoader /> : announcements.length === 0 ? (
        <div className="card"><EmptyState icon={Bell} title="No announcements" description="Create your first announcement for students and teachers" /></div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a._id} className={cn('card p-5 border-l-4', a.priority === 'high' ? 'border-l-red-400' : a.priority === 'medium' ? 'border-l-yellow-400' : 'border-l-slate-300')}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 items-center mb-2">
                    {a.priority === 'high' && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                    <h3 className="font-semibold text-slate-900 text-sm">{a.title}</h3>
                    <Badge variant={AUDIENCE_COLORS[a.audience] || 'blue'}>
                      {a.audience === 'all' ? 'Everyone' : a.audience}
                    </Badge>
                    {a.class && <Badge variant="blue">Std {a.class}</Badge>}
                    <Badge variant={PRIORITY_COLORS[a.priority] || 'slate'}>{a.priority}</Badge>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{a.content}</p>
                  <div className="flex gap-4 mt-3 text-xs text-slate-400">
                    <span>By {a.createdBy?.name}</span>
                    <span>{formatDateTime(a.createdAt)}</span>
                    {a.expiresAt && <span>Expires {formatDateTime(a.expiresAt)}</span>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => { setEditing(a); setModalOpen(true) }} className="btn btn-ghost btn-sm p-1.5"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteTarget(a)} className="btn btn-ghost btn-sm p-1.5 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? 'Edit Announcement' : 'New Announcement'} size="lg">
        <AnnouncementForm
          ann={editing}
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
        title="Delete Announcement"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmText="Delete"
        danger
      />
    </Sidebar>
  )
}
