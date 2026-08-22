import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, Badge, EmptyState, Select } from '@/components/ui'
import { materialService } from '@/services'
import { formatDate, formatFileSize } from '@/lib/utils'
import { BookOpen, Download, FileText } from 'lucide-react'

const TYPE_COLORS = { notes: 'blue', assignment: 'yellow', worksheet: 'purple', pdf: 'red', other: 'slate' }

export default function StudentMaterials() {
  const [filterType, setFilterType] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['materials', filterType],
    queryFn: () => materialService.getAll({ type: filterType || undefined }),
  })

  const materials = data?.materials || []

  return (
    <Sidebar>
      <div className="page-header">
        <h1 className="page-title">Study Materials</h1>
        <p className="page-subtitle">Download notes, assignments and worksheets</p>
      </div>

      <div className="card p-4 mb-4">
        <Select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-40">
          <option value="">All Types</option>
          {['notes', 'assignment', 'worksheet', 'pdf', 'other'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </Select>
      </div>

      {isLoading ? <PageLoader /> : materials.length === 0 ? (
        <div className="card"><EmptyState icon={BookOpen} title="No materials available" description="Your teacher will upload study materials here." /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map(m => (
            <div key={m._id} className="card-hover p-5 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm leading-tight truncate">{m.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{m.subject} · {m.class}</p>
                </div>
              </div>
              {m.description && <p className="text-xs text-slate-600 line-clamp-2">{m.description}</p>}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <Badge variant={TYPE_COLORS[m.type] || 'slate'}>{m.type}</Badge>
                  <span className="text-xs text-slate-400">{formatFileSize(m.fileSize)}</span>
                </div>
                <button onClick={() => materialService.download(m._id)} className="btn btn-primary btn-sm">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
              <p className="text-xs text-slate-400">{formatDate(m.createdAt)} · {m.uploadedBy?.name}</p>
            </div>
          ))}
        </div>
      )}
    </Sidebar>
  )
}
