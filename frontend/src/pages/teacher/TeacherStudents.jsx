import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, SearchInput, Select, Badge, Pagination, EmptyState, Avatar } from '@/components/ui'
import { studentService } from '@/services'
import { formatDate } from '@/lib/utils'
import { Users } from 'lucide-react'

const BATCHES = ['Morning', 'Evening', 'Weekend']
const CLASSES = ['8th', '9th', '10th','11th', '12th']

export default function TeacherStudents() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [filterBatch, setFilterBatch] = useState('')
  const [filterClass, setFilterClass] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['students', page, search, filterBatch, filterClass],
    queryFn: () => studentService.getAll({ page, limit: 15, search: search || undefined, batch: filterBatch || undefined, class: filterClass || undefined, status: 'active' }),
    placeholderData: (prev) => prev,
  })

  const students = data?.students || []
  const total = data?.total || 0
  const pages = data?.pages || 1

  return (
    <Sidebar>
      <div className="page-header">
        <h1 className="page-title">Students</h1>
        <p className="page-subtitle">{total} active students</p>
      </div>

      <div className="card p-4 mb-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search students…" className="flex-1 min-w-48" />
        <Select value={filterBatch} onChange={e => { setFilterBatch(e.target.value); setPage(1) }} className="w-36">
          <option value="">All Batches</option>
          {BATCHES.map(b => <option key={b}>{b}</option>)}
        </Select>
        <Select value={filterClass} onChange={e => { setFilterClass(e.target.value); setPage(1) }} className="w-36">
          <option value="">All Classes</option>
          {CLASSES.map(c => <option key={c}>{c}</option>)}
        </Select>
      </div>

      <div className="table-container">
        {isLoading ? <PageLoader /> : students.length === 0 ? (
          <EmptyState icon={Users} title="No students found" description="Adjust search or filters." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class / Batch</th>
                <th>Phone</th>
                <th>Parent</th>
                <th>Admission Date</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s._id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={s.fullName} size="sm" />
                      <div>
                        <p className="font-medium text-sm text-slate-900">{s.fullName}</p>
                        <p className="text-xs text-slate-500">{s.studentId}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="text-sm">{s.class}</p>
                    <p className="text-xs text-slate-500">{s.batch} batch</p>
                  </td>
                  <td><span className="text-sm">{s.phone || '—'}</span></td>
                  <td>
                    <p className="text-sm">{s.parentName || '—'}</p>
                    <p className="text-xs text-slate-500">{s.parentPhone || ''}</p>
                  </td>
                  <td><span className="text-sm">{formatDate(s.admissionDate)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} pages={pages} onPage={setPage} />
      </div>
    </Sidebar>
  )
}
