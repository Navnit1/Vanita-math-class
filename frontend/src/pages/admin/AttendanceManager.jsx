import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, EmptyState, TabBar, Select } from '@/components/ui'
import { attendanceService } from '@/services'
import { cn } from '@/lib/utils'
import { Calendar, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const CLASSES = [ '8th', '9th', '10th','11th', '12th' ]
const BATCHES = ['Morning', 'Evening', 'Weekend']
const STATUS_OPTS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'excused', label: 'Excused' },
]

export default function AttendanceManager() {
  const qc = useQueryClient()
  const [cls, setCls] = useState('8th')
  const [batch, setBatch] = useState('Morning')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [records, setRecords] = useState({})
  const [activeTab, setActiveTab] = useState('mark')

  const { data: attendanceData, isLoading, refetch } = useQuery({
    queryKey: ['attendance-batch', cls, batch, date],
    queryFn: () => attendanceService.getByBatchDate({ class: cls, batch, date }),
  })

  // React Query v5 compatible - use useEffect instead of onSuccess
  useEffect(() => {
    if (attendanceData?.attendance) {
      const initial = {}
      attendanceData.attendance.forEach(a => { initial[a.studentId] = a.status })
      setRecords(initial)
    }
  }, [attendanceData])

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['attendance-summary', cls, batch],
    queryFn: () => attendanceService.getSummary({ class: cls, batch }),
    enabled: activeTab === 'summary',
  })

  const markMutation = useMutation({
    mutationFn: attendanceService.markAttendance,
    onSuccess: () => { refetch(); toast.success('Attendance saved') },
    onError: err => toast.error(err.response?.data?.message || 'Failed to save attendance'),
  })

  const attendance = attendanceData?.attendance || []
  const presentCount = Object.values(records).filter(s => s === 'present' || s === 'late').length
  const absentCount = Object.values(records).filter(s => s === 'absent').length

  const toggleStatus = (studentId, status) => setRecords(prev => ({ ...prev, [studentId]: status }))
  const markAll = (status) => {
    const all = {}
    attendance.forEach(a => { all[a.studentId] = status })
    setRecords(all)
  }

  const handleSave = () => {
    const rec = attendance.map(a => ({ studentId: a.studentId, status: records[a.studentId] || 'absent' }))
    markMutation.mutate({ class: cls, batch, date, records: rec })
  }

  return (
    <Sidebar>
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">Mark and review batch attendance</p>
      </div>

      <TabBar
        tabs={[{ value: 'mark', label: 'Mark Attendance' }, { value: 'summary', label: 'Summary Report' }]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'mark' && (
        <div className="mt-5 space-y-4">
          <div className="card p-4 flex flex-wrap gap-3 items-end">
            <div>
              <label className="label">Standard</label>
              <div className="flex gap-1.5 flex-wrap max-w-md">
                {CLASSES.map(c => (
                  <button key={c} onClick={() => { setCls(c); setRecords({}) }}
                    className={cn('px-2.5 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                      cls === c ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300')}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Batch</label>
              <div className="flex gap-2">
                {BATCHES.map(b => (
                  <button key={b} onClick={() => { setBatch(b); setRecords({}) }}
                    className={cn('px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                      batch === b ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300')}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" value={date} onChange={e => { setDate(e.target.value); setRecords({}) }}
                max={format(new Date(), 'yyyy-MM-dd')} className="input w-44" />
            </div>
            {attendance.length > 0 && (
              <div className="ml-auto flex gap-2">
                <button onClick={() => markAll('present')} className="btn btn-secondary btn-sm text-green-600">All Present</button>
                <button onClick={() => markAll('absent')} className="btn btn-secondary btn-sm text-red-500">All Absent</button>
              </div>
            )}
          </div>

          {attendance.length > 0 && (
            <div className="flex gap-4 items-center px-1">
              <span className="text-sm text-green-600 font-medium flex items-center gap-1"><CheckCircle className="w-4 h-4" />{presentCount} Present</span>
              <span className="text-sm text-red-500 font-medium flex items-center gap-1"><XCircle className="w-4 h-4" />{absentCount} Absent</span>
              <span className="text-sm text-slate-500">{attendance.length} total students</span>
            </div>
          )}

          <div className="table-container">
            {isLoading ? <PageLoader /> : attendance.length === 0 ? (
              <EmptyState icon={Calendar} title={`No students in ${cls} - ${batch} batch`} description="Add students to this standard and batch first." />
            ) : (
              <>
                <table className="table">
                  <thead><tr><th>#</th><th>Student</th><th>ID</th><th>Status</th></tr></thead>
                  <tbody>
                    {attendance.map((a, i) => {
                      const cur = records[a.studentId] || 'absent'
                      return (
                        <tr key={a.studentId}>
                          <td className="text-slate-400 text-xs w-8">{i + 1}</td>
                          <td className="font-medium text-sm text-slate-900">{a.fullName}</td>
                          <td className="text-xs text-slate-500">{a.studentIdCode}</td>
                          <td>
                            <div className="flex gap-1.5">
                              {STATUS_OPTS.map(opt => (
                                <button key={opt.value} onClick={() => toggleStatus(a.studentId, opt.value)}
                                  className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                                    cur === opt.value
                                      ? opt.value === 'present' ? 'bg-green-100 text-green-700 border-green-300'
                                        : opt.value === 'absent' ? 'bg-red-100 text-red-700 border-red-300'
                                        : opt.value === 'late' ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                        : 'bg-blue-100 text-blue-700 border-blue-300'
                                      : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300')}>
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div className="px-4 py-3 flex justify-end border-t border-slate-100">
                  <button onClick={handleSave} disabled={markMutation.isPending} className="btn btn-primary">
                    {markMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Save Attendance'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="mt-5">
          <div className="card p-4 mb-4 flex flex-wrap gap-4 items-center">
            <div>
              <label className="label">Filter by Standard</label>
              <div className="flex gap-1.5 flex-wrap max-w-md">
                {CLASSES.map(c => (
                  <button key={c} onClick={() => setCls(c)}
                    className={cn('px-2.5 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                      cls === c ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300')}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Filter by Batch</label>
              <div className="flex gap-2">
                {BATCHES.map(b => (
                  <button key={b} onClick={() => setBatch(b)}
                    className={cn('px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                      batch === b ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300')}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="table-container">
            {summaryLoading ? <PageLoader /> : !(summaryData || []).length ? (
              <EmptyState icon={Calendar} title="No attendance data" description="Mark attendance to see summary here." />
            ) : (
              <table className="table">
                <thead><tr><th>Student</th><th>Class / Batch</th><th>Total Days</th><th>Present</th><th>Absent</th><th>Attendance %</th></tr></thead>
                <tbody>
                  {(summaryData || []).map(s => (
                    <tr key={s._id}>
                      <td><p className="font-medium text-sm">{s.fullName}</p><p className="text-xs text-slate-500">{s.studentId}</p></td>
                      <td>{s.class} · {s.batch}</td>
                      <td>{s.total}</td>
                      <td className="text-green-600 font-medium">{s.present}</td>
                      <td className="text-red-500 font-medium">{s.absent}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full', s.percentage >= 75 ? 'bg-green-500' : s.percentage >= 50 ? 'bg-yellow-400' : 'bg-red-500')} style={{ width: `${s.percentage}%` }} />
                          </div>
                          <span className={cn('text-sm font-medium', s.percentage >= 75 ? 'text-green-600' : s.percentage >= 50 ? 'text-yellow-600' : 'text-red-600')}>{s.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </Sidebar>
  )
}
