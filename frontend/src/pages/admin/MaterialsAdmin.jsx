import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, Modal, ConfirmDialog, FormField, Select, Badge, EmptyState, SearchInput } from '@/components/ui'
import { materialService } from '@/services'
import { formatDate, formatFileSize } from '@/lib/utils'
import { BookOpen, Plus, Trash2, Download, Upload, FileText, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const TYPES = ['notes', 'assignment', 'worksheet', 'pdf', 'other']
const CLASSES = [ '8th', '9th', '10th','11th', '12th' ,'All']
const BATCHES = ['Morning', 'Evening', 'Weekend', 'all']
const SUBJECTS = ['Mathematics', ]

const schema = z.object({
  title: z.string().min(3, 'Title required'),
  description: z.string().optional(),
  type: z.string().min(1, 'Select type'),
  subject: z.string().min(1, 'Subject required'),
  class: z.string().min(1, 'Select class'),
  batch: z.string().optional(),
})

function UploadForm({ onSave, onCancel, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: 'notes', batch: 'all' },
  })
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const fileRef = useRef()

  const handleSave = (data) => {
    if (!file) { setFileError('Please select a file to upload'); return }
    setFileError('')
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => { if (v) fd.append(k, v) })
    fd.append('file', file)
    onSave(fd)
  }

  return (
    <form onSubmit={handleSubmit(handleSave)} className="p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Title" error={errors.title?.message} required className="sm:col-span-2">
          <input {...register('title')} className={`input ${errors.title ? 'input-error' : ''}`} placeholder="e.g. Chapter 3 Notes - Quadratic Equations" />
        </FormField>
        <FormField label="Subject" error={errors.subject?.message} required>
          <Select {...register('subject')} className={errors.subject ? 'input-error' : ''}>
            <option value="">Select subject</option>
            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
          </Select>
        </FormField>
        <FormField label="Type" error={errors.type?.message} required>
          <Select {...register('type')}>
            {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </Select>
        </FormField>
        <FormField label="Class" error={errors.class?.message} required>
          <Select {...register('class')} className={errors.class ? 'input-error' : ''}>
            <option value="">Select class</option>
            {CLASSES.map(c => <option key={c}>{c}</option>)}
          </Select>
        </FormField>
        <FormField label="Batch" hint="Leave 'all' to share with all batches">
          <Select {...register('batch')}>
            {BATCHES.map(b => <option key={b} value={b}>{b === 'all' ? 'All Batches' : b}</option>)}
          </Select>
        </FormField>
        <FormField label="Description" className="sm:col-span-2">
          <textarea {...register('description')} className="input resize-none" rows={2} placeholder="Optional description" />
        </FormField>

        <FormField label="File" error={fileError} required hint="PDF, JPG, PNG — max 10 MB" className="sm:col-span-2">
          <div onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-lg p-5 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
            {file ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-600" />
                  <span className="text-sm text-slate-700 font-medium">{file.name}</span>
                  <span className="text-xs text-slate-500">({formatFileSize(file.size)})</span>
                </div>
                <button type="button" onClick={e => { e.stopPropagation(); setFile(null) }} className="text-red-500 hover:text-red-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Click to upload file</p>
                <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG supported</p>
              </div>
            )}
            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => { setFile(e.target.files?.[0] || null); setFileError('') }} />
          </div>
        </FormField>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</> : 'Upload Material'}
        </button>
      </div>
    </form>
  )
}

const TYPE_COLORS = { notes: 'blue', assignment: 'orange', worksheet: 'purple', pdf: 'red', other: 'slate' }

export default function MaterialsAdmin() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [filterType, setFilterType] = useState('')
  const [filterClass, setFilterClass] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['materials', filterType, filterClass],
    queryFn: () => materialService.getAll({ type: filterType || undefined, class: filterClass || undefined }),
  })

  const uploadMutation = useMutation({
    mutationFn: materialService.upload,
    onSuccess: () => { qc.invalidateQueries(['materials']); setModalOpen(false); toast.success('Material uploaded') },
    onError: err => toast.error(err.response?.data?.message || 'Upload failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: materialService.delete,
    onSuccess: () => { qc.invalidateQueries(['materials']); setDeleteTarget(null); toast.success('Material deleted') },
    onError: err => toast.error(err.response?.data?.message || 'Failed'),
  })

  const materials = data?.materials || []

  return (
    <Sidebar>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Study Materials</h1>
          <p className="page-subtitle">{materials.length} files uploaded</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Upload Material
        </button>
      </div>

      <div className="card p-4 mb-4 flex flex-wrap gap-3">
        <Select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-36">
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </Select>
        <Select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="w-36">
          <option value="">All Classes</option>
          {CLASSES.map(c => <option key={c}>{c}</option>)}
        </Select>
      </div>

      <div className="table-container">
        {isLoading ? <PageLoader /> : materials.length === 0 ? (
          <EmptyState icon={BookOpen} title="No materials uploaded" description="Upload notes, PDFs, assignments for students" />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Subject</th>
                <th>Type</th>
                <th>Class / Batch</th>
                <th>Size</th>
                <th>Uploaded</th>
                <th>Downloads</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {materials.map(m => (
                <tr key={m._id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <p className="font-medium text-sm text-slate-900 max-w-xs truncate">{m.title}</p>
                    </div>
                  </td>
                  <td><span className="text-sm">{m.subject}</span></td>
                  <td><Badge variant={TYPE_COLORS[m.type] || 'slate'}>{m.type}</Badge></td>
                  <td><p className="text-sm">{m.class} · {m.batch === 'all' ? 'All' : m.batch}</p></td>
                  <td><span className="text-xs text-slate-500">{formatFileSize(m.fileSize)}</span></td>
                  <td>
                    <p className="text-xs text-slate-500">{formatDate(m.createdAt)}</p>
                    <p className="text-xs text-slate-400">by {m.uploadedBy?.name}</p>
                  </td>
                  <td><span className="text-sm text-slate-600">{m.downloadCount}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => materialService.download(m._id)} className="btn btn-ghost btn-sm p-1.5 text-primary-600"><Download className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteTarget(m)} className="btn btn-ghost btn-sm p-1.5 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Upload Study Material" size="lg">
        <UploadForm loading={uploadMutation.isPending} onCancel={() => setModalOpen(false)} onSave={fd => uploadMutation.mutate(fd)} />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        loading={deleteMutation.isPending}
        title="Delete Material"
        message={`Delete "${deleteTarget?.title}"? The file will be permanently removed.`}
        confirmText="Delete"
        danger
      />
    </Sidebar>
  )
}
