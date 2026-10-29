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
  priority: z.string().min(1, 'Select priority'),
  class: z.string().optional(),
  expiresAt: z.string().optional(),
})

const CLASSES = ['8th', '9th', '10th', '+1', '+2']

function AnnouncementForm({ ann, onSave, onCancel, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: ann
      ? {
          title: ann.title,
          content: ann.content,
          priority: ann.priority,
          class: ann.class || '',
          expiresAt: ann.expiresAt ? ann.expiresAt.split('T')[0] : '',
        }
      : { priority: 'medium', class: '' },
  })

  const onSubmit = (data) => {
    // General announcements default to active students
    onSave({
      ...data,
      audience: 'students',
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
      <FormField label="Notice Title" error={errors.title?.message} required>
        <input
          {...register('title')}
          className={`input ${errors.title ? 'input-error' : ''}`}
          placeholder="e.g. Extra Class on Sunday / Holiday Notice"
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Target Standard / Class" hint="Leave blank to broadcast to all students">
          <Select {...register('class')}>
            <option value="">All Standards (8th to +2)</option>
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Priority Level" error={errors.priority?.message} required>
          <Select {...register('priority')}>
            <option value="low">Low (General Info)</option>
            <option value="medium">Medium (Standard Notice)</option>
            <option value="high">High (Urgent / Exam / Fees)</option>
          </Select>
        </FormField>
      </div>

      <FormField label="Notice Content" error={errors.content?.message} required>
        <textarea
          {...register('content')}
          className={`input resize-none ${errors.content ? 'input-error' : ''}`}
          rows={5}
          placeholder="Write the full announcement message for students…"
        />
      </FormField>

      <FormField label="Expiry Date (optional)" hint="Leave blank to keep active on the board">
        <input
          {...register('expiresAt')}
          type="date"
          className="input"
          min={new Date().toISOString().split('T')[0]}
        />
      </FormField>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {ann ? 'Updating…' : 'Publishing…'}
            </>
          ) : ann ? (
            'Update Notice'
          ) : (
            'Publish Notice'
          )}
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
    onSuccess: () => {
      qc.invalidateQueries(['announcements'])
      setModalOpen(false)
      toast.success('Notice published to student notice board')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => announcementService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['announcements'])
      setModalOpen(false)
      setEditing(null)
      toast.success('Notice updated successfully')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: announcementService.delete,
    onSuccess: () => {
      qc.invalidateQueries(['announcements'])
      setDeleteTarget(null)
      toast.success('Notice removed')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const announcements = data?.announcements || []

  return (
    <Sidebar>
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Announcements & Notices</h1>
          <p className="page-subtitle">Publish updates, holiday alerts, and schedule changes for students</p>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
          className="btn btn-primary self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : announcements.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No announcements published"
            description="Create notices for your students. They will immediately see them in their portal."
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {announcements.map((a) => (
              <div
                key={a._id}
                className={cn(
                  'p-5 transition-colors hover:bg-gray-50/50 flex flex-col sm:flex-row sm:items-start justify-between gap-4',
                  a.priority === 'high' && 'border-l-4 border-l-primary-600 bg-red-50/20'
                )}
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {a.priority === 'high' && (
                      <AlertCircle className="w-4 h-4 text-primary-600 shrink-0" />
                    )}
                    <h3 className="font-bold text-gray-900 text-base">{a.title}</h3>
                    {a.class ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200">
                        Class {a.class}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        All Classes
                      </span>
                    )}
                    <Badge
                      variant={
                        a.priority === 'high' ? 'danger' : a.priority === 'medium' ? 'warning' : 'slate'
                      }
                    >
                      {a.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line mt-1">
                    {a.content}
                  </p>
                  <p className="text-xs text-gray-400 mt-3">
                    Posted on {formatDateTime(a.createdAt)} · By {a.createdBy?.name || 'Vanita Rani Gupta'}
                  </p>
                </div>

                <div className="flex items-center gap-1 self-end sm:self-start">
                  <button
                    onClick={() => {
                      setEditing(a)
                      setModalOpen(true)
                    }}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    title="Edit announcement"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(a)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-red-50 transition-colors"
                    title="Delete announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        title={editing ? 'Edit Announcement' : 'Publish Announcement'}
        size="lg"
      >
        <AnnouncementForm
          ann={editing}
          loading={createMutation.isPending || updateMutation.isPending}
          onCancel={() => {
            setModalOpen(false)
            setEditing(null)
          }}
          onSave={(data) => {
            if (editing) updateMutation.mutate({ id: editing._id, data })
            else createMutation.mutate(data)
          }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        loading={deleteMutation.isPending}
        title="Delete Announcement"
        message={`Delete "${deleteTarget?.title}"? Students will no longer see this notice.`}
        confirmText="Delete"
        danger
      />
    </Sidebar>
  )
}
