import { useState, useEffect } from 'react'
import { X, Upload, BookOpen, AlertCircle } from 'lucide-react'

export default function UploadNotesModal({
  isOpen,
  onClose,
  onSave,
  noteToEdit = null,
  batches = [],
}) {
  const [title, setTitle] = useState('')
  const [grade, setGrade] = useState('10th Class')
  const [topic, setTopic] = useState('')
  const [content, setContent] = useState('')
  const [pdfAttachmentName, setPdfAttachmentName] = useState('')
  const [isImportant, setIsImportant] = useState(false)
  const [file, setFile] = useState(null)

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title || '')
      setGrade(noteToEdit.class || noteToEdit.grade || '10th Class')
      setTopic(noteToEdit.topic || noteToEdit.chapter || '')
      setContent(noteToEdit.content || noteToEdit.description || '')
      setPdfAttachmentName(noteToEdit.fileName || noteToEdit.pdfAttachmentName || '')
      setIsImportant(!!noteToEdit.isImportant)
      setFile(null)
    } else {
      setTitle('')
      setGrade('10th Class')
      setTopic('')
      setContent('')
      setPdfAttachmentName('')
      setIsImportant(false)
      setFile(null)
    }
  }, [noteToEdit, isOpen])

  if (!isOpen) return null

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    if (selectedFile.size > 20 * 1024 * 1024) {
      alert('File size exceeds 20MB. Please choose a smaller PDF or document.')
      return
    }
    setFile(selectedFile)
    setPdfAttachmentName(selectedFile.name)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !grade.trim()) {
      alert('Please fill in note title and class')
      return
    }

    const payload = {
      ...(noteToEdit ? { _id: noteToEdit._id, id: noteToEdit.id || noteToEdit._id } : {}),
      title: title.trim(),
      class: grade,
      grade,
      topic: topic.trim(),
      chapter: topic.trim(),
      content: content.trim(),
      description: content.trim(),
      pdfAttachmentName,
      fileName: pdfAttachmentName || `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`,
      isImportant,
      type: 'notes',
      file,
    }

    onSave(payload)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[92vh] flex flex-col border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-neutral-900">
              {noteToEdit ? 'Edit Math Study Notes' : 'Upload / Post New Study Material'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-xs sm:text-sm">
          {/* Note Title */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Title / Document Heading <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Class 10th Math: Complete Formula Sheet & Trigonometry Tables"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>

          {/* Grade & Topic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Target Class / Grade <span className="text-rose-500">*</span>
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white font-medium"
              >
                <option value="8th Class">Class 8th</option>
                <option value="9th Class">Class 9th</option>
                <option value="10th Class">Class 10th (Board)</option>
                <option value="+1 (11th) Mathematics">+1 (11th)</option>
                <option value="+2 (12th) Mathematics">+2 (12th Board)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Chapter / Topic Name
              </label>
              <input
                type="text"
                placeholder="e.g. Trigonometry & Quadratic Equations"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>
          </div>

          {/* Content / Formulas Text Area */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Formulas / Concepts / In-App Text Content
            </label>
            <textarea
              rows={5}
              placeholder="Paste mathematical formulas, key theorems, derivations, or summaries here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 font-mono text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>

          {/* File Attachment Upload */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              PDF / Assignment Document File
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50 hover:bg-neutral-100 cursor-pointer text-xs font-semibold text-neutral-700">
                <Upload className="w-4 h-4 text-neutral-500" />
                <span>{file ? 'Change PDF File' : 'Select PDF File'}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {pdfAttachmentName && (
                <span className="text-xs text-neutral-600 font-mono truncate max-w-xs">
                  {pdfAttachmentName}
                </span>
              )}
            </div>
          </div>

          {/* Mark as High Priority / Exam Important */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-400"
              />
              <span className="text-xs font-semibold text-neutral-800">
                ⭐ Mark as High Priority / Must-Revise for Exams
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-100 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {noteToEdit ? 'Save Changes' : 'Post Study Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
