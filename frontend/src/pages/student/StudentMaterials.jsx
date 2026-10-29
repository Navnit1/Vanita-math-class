import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, Badge, EmptyState, Modal } from '@/components/ui'
import { materialService } from '@/services'
import { formatDate, formatFileSize } from '@/lib/utils'
import {
  BookOpen,
  Download,
  FileText,
  Eye,
  Search,
  Tag,
  FolderOpen,
  X,
  ExternalLink,
} from 'lucide-react'

export default function StudentMaterials() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [viewingMaterial, setViewingMaterial] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['materials', selectedType],
    queryFn: () => materialService.getAll({ type: selectedType || undefined }),
  })

  const materials = data?.materials || []

  const filteredMaterials = materials.filter((m) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      m.title?.toLowerCase().includes(term) ||
      m.topic?.toLowerCase().includes(term) ||
      m.chapter?.toLowerCase().includes(term) ||
      m.description?.toLowerCase().includes(term) ||
      m.tags?.some((t) => t.toLowerCase().includes(term))
    )
  })

  return (
    <Sidebar>
      <div className="page-header">
        <h1 className="page-title">Class Mathematics Notes & Sheets</h1>
        <p className="page-subtitle">
          Curated PDF notes, formula sheets, and chapter assignments for your standard
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by topic, chapter, title, or formula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Document Types</option>
          <option value="notes">Notes / Theory</option>
          <option value="formula">Formula Sheet</option>
          <option value="assignment">Assignment</option>
          <option value="worksheet">Worksheet</option>
          <option value="pdf">General PDF</option>
        </select>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : filteredMaterials.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={BookOpen}
            title="No study materials found"
            description="Mathematics notes and formula sheets uploaded for your class will appear here."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMaterials.map((m) => (
            <div
              key={m._id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-primary-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center shrink-0 border border-primary-100">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200 uppercase">
                        Class {m.class}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {m.type || 'PDF'}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm leading-snug truncate" title={m.title}>
                      {m.title}
                    </h3>
                  </div>
                </div>

                {/* Chapter & Topic */}
                {(m.chapter || m.topic) && (
                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-gray-600">
                    {m.chapter && (
                      <span className="inline-flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                        <FolderOpen className="w-3 h-3 text-gray-400" /> {m.chapter}
                      </span>
                    )}
                    {m.topic && (
                      <span className="inline-flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 font-medium text-gray-700">
                        {m.topic}
                      </span>
                    )}
                  </div>
                )}

                {m.description && (
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                    {m.description}
                  </p>
                )}

                {/* Tags */}
                {m.tags && m.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {m.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  {formatDate(m.createdAt)} {m.fileSize ? `· ${formatFileSize(m.fileSize)}` : ''}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewingMaterial(m)}
                    className="btn btn-outline btn-sm border-gray-300 text-gray-700 hover:text-primary-600 hover:border-primary-400 flex items-center gap-1"
                    title="Read inside website viewer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Read
                  </button>

                  <a
                    href={materialService.viewUrl(m._id)}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-sm flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* In-Website Protected PDF Viewer Modal */}
      {viewingMaterial && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="px-6 py-3.5 bg-gray-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-5 h-5 text-primary-500 shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-bold text-sm truncate text-white">
                    {viewingMaterial.title}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">
                    Class {viewingMaterial.class} · {viewingMaterial.topic || viewingMaterial.chapter || 'Vanita Math Classes'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={materialService.viewUrl(viewingMaterial._id)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Full Window
                </a>
                <button
                  onClick={() => setViewingMaterial(null)}
                  className="w-8 h-8 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* In-App PDF Stream Embed */}
            <div className="flex-1 w-full bg-gray-100 relative">
              <iframe
                src={`${materialService.viewUrl(viewingMaterial._id)}#toolbar=1`}
                title={viewingMaterial.title}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  )
}
