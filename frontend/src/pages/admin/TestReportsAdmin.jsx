import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, Modal, ConfirmDialog, FormField, Select, EmptyState } from '@/components/ui'
import { testReportService, studentService } from '@/services'
import { formatDate, formatFileSize } from '@/lib/utils'
import { ClipboardCheck, Plus, Trash2, Download, Upload, FileText, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const schema = z.object({
  assignTo: z.enum(['student', 'class']).default('student'),
  student: z.string().optional(),
  class: z.string().optional(),
  batch: z.string().optional(),
  title: z.string().min(3, 'Title required'),
  subject: z.string().optional(),
  testDate: z.string().optional(),
  marksObtained: z.string().optional(),
  totalMarks: z.string().optional(),
  remarks: z.string().optional(),
}).refine(d => d.assignTo === 'student' ? !!d.student : !!d.class, {
  message: 'Required', path: ['student'],
})

const CLASSES = ['8th', '9th', '10th', '11th', '12th']

function UploadForm({ students, onSave, onCancel, loading }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { assignTo: 'student', batch: 'all' },
  })
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const fileRef = useRef()
  const assignTo = watch('assignTo')

  const handleSave = (data) => {
    if (!file) { setFileError('Please select a PDF to upload'); return }
    setFileError('')
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => { if (v && k !== 'assignTo') fd.append(k, v) })
    fd.append('file', file)
    onSave(fd)
  }

  return (
    <form onSubmit={handleSubmit(handleSave)} className="p-6 space-y-4">
      <FormField label="Assign to">
        <div className="flex gap-2">
          <label className={`flex-1 flex items-center justify-center gap-2 border rounded-lg py-2 text-sm cursor-pointer ${assignTo === 'student' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600'}`}>
            <input type="radio" value="student" {...register('assignTo')} className="hidden" />
            One student
          </label>
          <label className={`flex-1 flex items-center justify-center gap-2 border rounded-lg py-2 text-sm cursor-pointer ${assignTo === 'class' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600'}`}>
            <input type="radio" value="class" {...register('assignTo')} className="hidden" />
            Whole class / batch
          </label>
        </div>
      </FormField>

      {assignTo === 'student' ? (
        <FormField label="Student" error={errors.student?.message} required>
          <Select {...register('student')} className={errors.student ? 'input-error' : ''}>
            <option value="">Select student</option>
            {students.map(s => (
              <option key={s._id} value={s._id}>{s.fullName} — {s.class} — {s.studentId}</option>
            ))}
          </Select>
        </FormField>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Standard" error={errors.class?.message} required>
            <Select {...register('class')} className={errors.class ? 'input-error' : ''}>
              <option value="">Select standard</option>
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </FormField>
          <FormField label="Batch" hint="Leave as 'All' to cover every batch in that standard">
            <Select {...register('batch')}>
              <option value="all">All batches</option>
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
            </Select>
          </FormField>
        </div>
      )}

      <FormField label="Title" error={errors.title?.message} required>
        <input {...register('title')} className={`input ${errors.title ? 'input-error' : ''}`} placeholder="e.g. Unit Test 2 - Quadratic Equations" />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Subject">
          <input {...register('subject')} className="input" placeholder="e.g. Mathematics" />
        </FormField>
        <FormField label="Test Date">
          <input type="date" {...register('testDate')} className="input" />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Marks Obtained">
          <input type="number" step="0.01" {...register('marksObtained')} className="input" placeholder="e.g. 42" />
        </FormField>
        <FormField label="Total Marks">
          <input type="number" step="0.01" {...register('totalMarks')} className="input" placeholder="e.g. 50" />
        </FormField>
      </div>

      <FormField label="Remarks" hint="Optional note visible to the student">
        <textarea {...register('remarks')} className="input resize-none" rows={2} placeholder="e.g. Good improvement in trigonometry" />
      </FormField>

      <FormField label="Report PDF" error={fileError} required hint="PDF only — max 10 MB">
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
              <p className="text-sm text-slate-500">Click to upload the report PDF</p>
            </div>
          )}
          <input ref={fileRef} type="file" className="hidden" accept="application/pdf"
            onChange={e => { setFile(e.target.files?.[0] || null); setFileError('') }} />
        </div>
      </FormField>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</> : 'Upload Report'}
        </button>
      </div>
    </form>
  )
}

export default function TestReportsAdmin() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [filterClass, setFilterClass] = useState('')

  const { data: studentData } = useQuery({
    queryKey: ['students', 'for-test-reports'],
    queryFn: () => studentService.getAll({ limit: 500, status: 'active' }),
  })
  const students = studentData?.students || []

  const { data, isLoading } = useQuery({
    queryKey: ['testReports'],
    queryFn: () => testReportService.getAll({ limit: 100 }),
  })
  const reports = data?.reports || []
  const filteredReports = filterClass
    ? reports.filter(r => (r.student?.class || r.class) === filterClass)
    : reports

  const uploadMutation = useMutation({
    mutationFn: testReportService.upload,
    onSuccess: () => { qc.invalidateQueries(['testReports']); setModalOpen(false); toast.success('Test report uploaded') },
    onError: err => toast.error(err.response?.data?.message || 'Upload failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: testReportService.delete,
    onSuccess: () => { qc.invalidateQueries(['testReports']); setDeleteTarget(null); toast.success('Report deleted') },
    onError: err => toast.error(err.response?.data?.message || 'Failed'),
  })

  return (
    <Sidebar>
      <div className="page-header flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Test Reports</h1>
          <p className="page-subtitle">{filteredReports.length} of {reports.length} reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="w-36">
            <option value="">All classes</option>
            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <button onClick={() => setModalOpen(true)} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Upload Report
          </button>
        </div>
      </div>

    <div className="table-container">
        {isLoading ? <PageLoader /> : filteredReports.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title={filterClass ? `No reports for ${filterClass}` : 'No test reports yet'} description="Upload a student's test PDF and they'll see it in their portal." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Student</th>
                <th>Subject</th>
                <th>Marks</th>
                <th>Uploaded</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map(r => (
                <tr key={r._id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <p className="font-medium text-sm text-slate-900 max-w-xs truncate">{r.title}</p>
                    </div>
                  </td>
                  <td>
                    {r.student ? (
                      <>
                        <p className="text-sm text-slate-900">{r.student?.fullName}</p>
                        <p className="text-xs text-slate-500">{r.student?.class} · {r.student?.studentId}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-slate-900">Whole class — {r.class}</p>
                        <p className="text-xs text-slate-500">{r.batch === 'all' ? 'All batches' : r.batch}</p>
                      </>
                    )}
                  </td>
                  <td><span className="text-sm">{r.subject || '—'}</span></td>
                  <td><span className="text-sm">{r.marksObtained != null && r.totalMarks != null ? `${r.marksObtained} / ${r.totalMarks}` : '—'}</span></td>
                  <td><p className="text-xs text-slate-500">{formatDate(r.createdAt)}</p></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => testReportService.download(r._id, r.fileName)} className="btn btn-ghost btn-sm p-1.5 text-primary-600"><Download className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteTarget(r)} className="btn btn-ghost btn-sm p-1.5 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Upload Test Report" size="lg">
        <UploadForm students={students} loading={uploadMutation.isPending} onCancel={() => setModalOpen(false)} onSave={fd => uploadMutation.mutate(fd)} />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        loading={deleteMutation.isPending}
        title="Delete Test Report"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmText="Delete"
        danger
      />
    </Sidebar>
  )
}