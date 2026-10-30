import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal, FormField, Select } from '@/components/ui'
import { materialService } from '@/services'
import { Upload, Loader2, FileText, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

const CLASSES = ['8th', '9th', '10th', '+1', '+2']
const BATCHES = ['All Batches', 'Evening', 'Morning', 'Weekend']

export default function UploadNotesModal({ isOpen, onClose }) {
  const [title, setTitle] = useState('')
  const [studentClass, setStudentClass] = useState('10th')
  const [batch, setBatch] = useState('All Batches')
  const [topic, setTopic] = useState('')
  const [chapter, setChapter] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)

  const qc = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: (formData) => materialService.upload(formData),
    onSuccess: () => {
      qc.invalidateQueries(['materials'])
      qc.invalidateQueries(['admin-dashboard'])
      toast.success('Math notes PDF uploaded successfully!')
      setTitle('')
      setTopic('')
      setChapter('')
      setDescription('')
      setFile(null)
      onClose()
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to upload notes PDF')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!file) {
      toast.error('Please select a PDF file to upload')
      return
    }

    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('class', studentClass)
    formData.append('batch', batch)
    formData.append('topic', topic.trim())
    formData.append('chapter', chapter.trim())
    formData.append('description', description.trim())
    formData.append('file', file)

    uploadMutation.mutate(formData)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Math Notes / Formula Sheet" size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <FormField label="Material Title" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Chapter 8 Trigonometric Identities Formula Sheet"
            className="input"
            required
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Standard / Class" required>
            <Select value={studentClass} onChange={(e) => setStudentClass(e.target.value)}>
              {CLASSES.map((c) => (
                <option key={c} value={c}>
                  Class {c}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Batch Audience" required>
            <Select value={batch} onChange={(e) => setBatch(e.target.value)}>
              {BATCHES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Topic / Concept">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Proofs & Shortcuts"
              className="input text-xs"
            />
          </FormField>

          <FormField label="Chapter Name">
            <input
              type="text"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              placeholder="e.g. Introduction to Trigonometry"
              className="input text-xs"
            />
          </FormField>
        </div>

        <FormField label="PDF File Document" required>
          <div className="border-2 border-dashed border-[#D9DDE3] hover:border-[#E50914] rounded-xl p-4 text-center cursor-pointer transition-colors bg-[#FAFAFA]">
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="notes-file-input"
              required
            />
            <label htmlFor="notes-file-input" className="cursor-pointer block">
              <FileText className="w-8 h-8 text-[#E50914] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#171717]">
                {file ? file.name : 'Click to select PDF document'}
              </p>
              <p className="text-[10px] text-[#64748B] mt-0.5">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'PDF files up to 25MB'}
              </p>
            </label>
          </div>
        </FormField>

        <div className="flex gap-3 justify-end pt-4 border-t border-[#D9DDE3]">
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploadMutation.isPending || !file}
            className="btn btn-primary btn-sm font-bold shadow-red-glow flex items-center gap-1.5"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Upload Material
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
