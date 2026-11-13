import { useState } from 'react'
import {
  BookOpen,
  Plus,
  Search,
  FileText,
  Download,
  Trash2,
  Edit2,
  Copy,
  Star,
  Eye,
  X,
  Sparkles
} from 'lucide-react'
import { formatDate } from '@/utils/formatters'
import UploadNotesModal from '../modals/UploadNotesModal'

export default function MathNotesView({
  notes = [],
  settings = {},
  batches = [],
  onSaveNote,
  onDeleteNote,
  isUploadOpen = false,
  onCloseUpload,
}) {
  const [classFilter, setClassFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [noteToEdit, setNoteToEdit] = useState(null)
  const [viewingNote, setViewingNote] = useState(null)

  const filteredNotes = notes.filter((n) => {
    const nGrade = n.class || n.grade || ''
    const matchesClass = classFilter === 'all' || nGrade === classFilter
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      !q ||
      (n.title || '').toLowerCase().includes(q) ||
      (n.topic || n.chapter || '').toLowerCase().includes(q) ||
      (n.content || n.description || '').toLowerCase().includes(q)

    return matchesClass && matchesSearch
  })

  const handleOpenUpload = (grade = null) => {
    setNoteToEdit(grade ? { grade } : null)
    setIsModalOpen(true)
  }

  const handleClone = (note) => {
    setNoteToEdit({
      ...note,
      id: undefined,
      _id: undefined,
      title: `${note.title} (Copy)`,
    })
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Upload/Edit Modal */}
      <UploadNotesModal
        isOpen={isModalOpen || isUploadOpen}
        onClose={() => {
          setIsModalOpen(false)
          setNoteToEdit(null)
          if (onCloseUpload) onCloseUpload()
        }}
        onSave={(data) => {
          if (onSaveNote) onSaveNote(data)
          setIsModalOpen(false)
          setNoteToEdit(null)
          if (onCloseUpload) onCloseUpload()
        }}
        noteToEdit={noteToEdit}
        batches={batches}
      />

      {/* Reader Modal (For full mathematical note viewing) */}
      {viewingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80">
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-indigo-100 text-indigo-800">
                  {viewingNote.class || viewingNote.grade}
                </span>
                <h2 className="text-base font-bold text-neutral-900 mt-1">{viewingNote.title}</h2>
                <p className="text-xs text-neutral-500">Topic: {viewingNote.topic || viewingNote.chapter}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingNote(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4 text-xs sm:text-sm">
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 font-mono text-xs whitespace-pre-wrap leading-relaxed text-neutral-800">
                {viewingNote.content || viewingNote.description || 'No detailed text available.'}
              </div>

              {(viewingNote.pdfAttachmentName || viewingNote.fileName) && (
                <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <span className="font-mono text-xs font-semibold text-indigo-950">
                      {viewingNote.pdfAttachmentName || viewingNote.fileName}
                    </span>
                  </div>
                  {viewingNote.filePath && (
                    <a
                      href={viewingNote.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
            <span>Study Materials & Formula Sheets</span>
            <span>·</span>
            <span className="font-mono">{notes.length} Documents Available</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
            Math Notes & Formula Cheat Sheets
          </h1>
        </div>

        <button
          type="button"
          onClick={() => handleOpenUpload()}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-xl transition-all cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Upload Study Material</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-neutral-200 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row gap-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes by title, topic, or keyword (e.g. Calculus, Trigonometry, Quadratic)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 bg-neutral-50/50"
          />
        </div>

        <div className="w-full md:w-64">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 bg-white font-medium"
          >
            <option value="all">All Classes (8th, 9th, 10th, +1, +2)</option>
            <option value="8th Class">Class 8th</option>
            <option value="9th Class">Class 9th</option>
            <option value="10th Class">Class 10th (Board)</option>
            <option value="+1 (11th) Mathematics">+1 (11th)</option>
            <option value="+2 (12th) Mathematics">+2 (12th Board)</option>
          </select>
        </div>
      </div>

      {/* Notes Cards Grid */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center max-w-md mx-auto">
          <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400 mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900">No Study Materials Found</h3>
          <p className="text-xs text-neutral-500 mt-1 mb-4">
            Upload mathematics notes, formulas, or assignment PDFs for your students.
          </p>
          <button
            type="button"
            onClick={() => handleOpenUpload()}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg cursor-pointer"
          >
            + Upload First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map((note) => {
            const grade = note.class || note.grade
            const isImportant = !!note.isImportant

            return (
              <div
                key={note._id || note.id}
                className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:border-neutral-300 transition-all shadow-sm flex flex-col justify-between"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-sky-100 text-sky-800">
                      {grade}
                    </span>
                    {isImportant && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>Must-Revise</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-neutral-900 text-sm line-clamp-2">{note.title}</h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      Topic: {note.topic || note.chapter || 'Mathematics Essentials'}
                    </p>
                  </div>

                  {note.content && (
                    <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-100 text-[11px] font-mono text-neutral-600 line-clamp-3 leading-relaxed">
                      {note.content}
                    </div>
                  )}

                  {(note.pdfAttachmentName || note.fileName) && (
                    <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-semibold font-mono">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{note.pdfAttachmentName || note.fileName}</span>
                    </div>
                  )}
                </div>

                <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setViewingNote(note)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Notes</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleClone(note)}
                      className="p-1.5 text-neutral-500 hover:text-neutral-800 rounded cursor-pointer"
                      title="Clone Note"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNoteToEdit(note)
                        setIsModalOpen(true)
                      }}
                      className="p-1.5 text-neutral-500 hover:text-neutral-800 rounded cursor-pointer"
                      title="Edit Note"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete note "${note.title}"?`)) {
                          onDeleteNote(note._id || note.id)
                        }
                      }}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 rounded cursor-pointer"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
