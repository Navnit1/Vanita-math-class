import { useState, useRef } from 'react'
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
  EmptyState,
} from '@/components/ui'
import { materialService } from '@/services'
import { formatDate, formatFileSize } from '@/lib/utils'
import {
  BookOpen,
  Plus,
  Trash2,
  Download,
  Upload,
  FileText,
  X,
  Loader2,
  Eye,
  ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'

const TYPES = ['notes', 'assignment', 'worksheet', 'formula', 'pdf', 'other']
const CLASSES = ['8th', '9th', '10th', '+1', '+2', 'All']
const BATCHES = ['Morning', 'Evening', 'Weekend', 'all']
const SUBJECTS = ['Mathematics']

const schema = z.object({
  title: z.string().min(3, 'Title is required (min 3 chars)'),
  description: z.string().optional(),
  type: z.string().min(1, 'Select document type'),
  subject: z.string().min(1, 'Subject required'),
  class: z.string().min(1, 'Select class'),
  batch: z.string().optional(),
  chapter: z.string().optional(),
  topic: z.string().optional(),
  tags: z.string().optional(),
})

function UploadForm({ onSave, onCancel, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: 'notes', batch: 'all', subject: 'Mathematics' },
  })
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const fileRef = useRef()

  const handleSave = (data) => {
    if (!file) {
      setFileError('Please select a file to upload')
      return
    }
    setFileError('')
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== '') fd.append(k, v)
    })
    fd.append('file', file)
    onSave(fd)
  }

  return (
    <form onSubmit={handleSubmit(handleSave)} className="p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Document Title" error={errors.title?.message} required className="sm:col-span-2">
          <input
            {...register('title')}
            className={`input ${errors.title ? 'input-error' : ''}`}
            placeholder="e.g. Chapter 3 Notes — Quadratic Equations"
          />
        </FormField>

        <FormField label="Class / Standard" error={errors.class?.message} required>
          <Select {...register('class')} className={errors.class ? 'input-error' : ''}>
            <option value="">Select standard</option>
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Document Type" error={errors.type?.message} required>
          <Select {...register('type')}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Chapter / Unit" hint="e.g. Unit 2 — Algebra">
          <input {...register('chapter')} className="input" placeholder="e.g. Chapter 4" />
        </FormField>

        <FormField label="Topic / Subtopic" hint="e.g. Factorisation & Discriminant">
          <input {...register('topic')} className="input" placeholder="e.g. Trigonometric Identities" />
        </FormField>

        <FormField label="Applicable Batch" hint="Leave 'All Batches' to share with all students">
          <Select {...register('batch')}>
            {BATCHES.map((b) => (
              <option key={b} value={b}>
                {b === 'all' ? 'All Batches' : b}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Tags (comma-separated)" hint="e.g. formulas, ncert, revision">
          <input {...register('tags')} className="input" placeholder="formulas, pyq, ncert" />
        </FormField>

        <FormField label="Description / Instructions" className="sm:col-span-2">
          <textarea
            {...register('description')}
            className="input resize-none"
            rows={2}
            placeholder="Notes summary, exercises to solve, or hints"
          />
        </FormField>

        <FormField
          label="PDF Document or Image"
          error={fileError}
          required
          hint="PDF, JPG, PNG — max 10 MB"
          className="sm:col-span-2"
        >
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/20 transition-colors"
          >
            {file ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-semibold text-gray-800">{file.name}</span>
                  <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                  }}
                  className="text-primary-600 hover:text-primary-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">Click to select file</p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10 MB</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null)
                setFileError('')
              }}
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
              Uploading…
            </>
          ) : (
            'Upload Notes'
          )}
        </button>
      </div>
    </form>
  )
}

export default function MaterialsAdmin() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [previewItem, setPreviewItem] = useState(null)
  const [filterType, setFilterType] = useState('')
  const [filterClass, setFilterClass] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['materials', filterType, filterClass],
    queryFn: () =>
      materialService.getAll({
        type: filterType || undefined,
        class: filterClass || undefined,
      }),
  })

  const uploadMutation = useMutation({
    mutationFn: materialService.upload,
    onSuccess: () => {
      qc.invalidateQueries(['materials'])
      qc.invalidateQueries(['admin-dashboard'])
      setModalOpen(false)
      toast.success('Math notes uploaded successfully')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Upload failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: materialService.delete,
    onSuccess: () => {
      qc.invalidateQueries(['materials'])
      qc.invalidateQueries(['admin-dashboard'])
      setDeleteTarget(null)
      toast.success('Material deleted')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const materials = data?.materials || []

  return (
    <Sidebar>
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Mathematics Notes & Resources</h1>
          <p className="page-subtitle">{materials.length} PDF notes & formula sheets published</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn btn-primary self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Upload New Notes
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 shadow-sm">
        <Select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-40"
        >
          <option value="">All Document Types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </Select>
        <Select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="w-40"
        >
          <option value="">All Standards</option>
          {CLASSES.map((c) => (
            <option key={c} value={c}>
              Class {c}
            </option>
          ))}
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : materials.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No study materials uploaded"
            description="Upload PDF notes, worksheets, and formula sheets for your classes."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Standard</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Uploaded</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {materials.map((m) => (
                  <tr key={m._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-2.5">
                        <FileText className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-gray-900 text-sm max-w-sm">{m.title}</p>
                          {(m.chapter || m.topic) && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {m.chapter ? `${m.chapter} · ` : ''}
                              {m.topic}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200">
                        Class {m.class}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700 capitalize">
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      {formatFileSize(m.fileSize)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      {formatDate(m.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewItem(m)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-gray-100 transition-colors"
                          title="Preview in website viewer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href={materialService.viewUrl(m._id)}
                          download
                          className="p-1.5 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-gray-100 transition-colors"
                          title="Download file"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => setDeleteTarget(m)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-red-50 transition-colors"
                          title="Delete material"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Upload Class Mathematics Notes"
        size="lg"
      >
        <UploadForm
          loading={uploadMutation.isPending}
          onCancel={() => setModalOpen(false)}
          onSave={(fd) => uploadMutation.mutate(fd)}
        />
      </Modal>

      {/* PDF Viewer Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200">
            <div className="px-6 py-3.5 bg-gray-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-5 h-5 text-primary-500 shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-bold text-sm truncate text-white">{previewItem.title}</h3>
                  <p className="text-xs text-gray-400 truncate">
                    Class {previewItem.class} · {previewItem.chapter || previewItem.topic || 'Vanita Math Classes'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={materialService.viewUrl(previewItem._id)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700 text-xs font-semibold flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Full Tab
                </a>
                <button
                  onClick={() => setPreviewItem(null)}
                  className="w-8 h-8 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 w-full bg-gray-100 relative">
              <iframe
                src={`${materialService.viewUrl(previewItem._id)}#toolbar=1`}
                title={previewItem.title}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        loading={deleteMutation.isPending}
        title="Delete Notes"
        message={`Delete "${deleteTarget?.title}"? The file will be removed for students.`}
        confirmText="Delete"
        danger
      />
    </Sidebar>
  )
}
