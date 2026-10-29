import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, EmptyState, TabBar, Select } from '@/components/ui'
import { attendanceService } from '@/services'
import { cn } from '@/lib/utils'
import { Calendar, CheckCircle, XCircle, Clock, Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const CLASSES = ['8th', '9th', '10th', '+1', '+2']
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

  useEffect(() => {
    if (attendanceData?.attendance) {
      const initial = {}
      attendanceData.attendance.forEach((a) => {
        initial[a.studentId] = a.status
      })
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
    onSuccess: () => {
      refetch()
      toast.success('Attendance saved successfully')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save attendance'),
  })

  const attendance = attendanceData?.attendance || []
  const presentCount = Object.values(records).filter((s) => s === 'present' || s === 'late').length
  const absentCount = Object.values(records).filter((s) => s === 'absent').length

  const toggleStatus = (studentId, status) =>
    setRecords((prev) => ({ ...prev, [studentId]: status }))

  const markAll = (status) => {
    const all = {}
    attendance.forEach((a) => {
      all[a.studentId] = status
    })
    setRecords(all)
  }

  const handleSave = () => {
    const rec = attendance.map((a) => ({
      studentId: a.studentId,
      status: records[a.studentId] || 'absent',
    }))
    markMutation.mutate({ class: cls, batch, date, records: rec })
  }

  return (
    <Sidebar>
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Attendance Manager</h1>
          <p className="page-subtitle">Track daily class presence by standard and batch</p>
        </div>
        {activeTab === 'mark' && attendance.length > 0 && (
          <button
            onClick={handleSave}
            disabled={markMutation.isPending}
            className="btn btn-primary gap-2 self-start sm:self-auto"
          >
            {markMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Attendance
          </button>
        )}
      </div>

      <TabBar
        tabs={[
          { value: 'mark', label: 'Mark Attendance' },
          { value: 'summary', label: 'Summary Report' },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'mark' && (
        <div className="mt-5 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-wrap gap-4 items-end justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Standard</label>
                <div className="flex gap-1.5 flex-wrap">
                  {CLASSES.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setCls(c)
                        setRecords({})
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors',
                        cls === c
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      )}
                    >
                      Class {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Batch</label>
                <div className="flex gap-1.5">
                  {BATCHES.map((b) => (
                    <button
                      key={b}
                      onClick={() => {
                        setBatch(b)
                        setRecords({})
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors',
                        batch === b
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      )}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="border border-gray-300 rounded-lg text-xs font-semibold px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {attendance.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => markAll('present')}
                  className="btn btn-outline btn-sm text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                >
                  Mark All Present
                </button>
                <button
                  onClick={() => markAll('absent')}
                  className="btn btn-outline btn-sm text-xs text-primary-700 border-primary-300 hover:bg-red-50"
                >
                  Mark All Absent
                </button>
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          {attendance.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm text-center">
                <p className="text-xs text-gray-500 font-medium">Total In Batch</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{attendance.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm text-center">
                <p className="text-xs text-gray-500 font-medium">Present Today</p>
                <p className="text-xl font-bold text-emerald-600 mt-0.5">{presentCount}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm text-center">
                <p className="text-xs text-gray-500 font-medium">Absent Today</p>
                <p className="text-xl font-bold text-primary-600 mt-0.5">{absentCount}</p>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <PageLoader />
            ) : attendance.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No students found for this batch"
                description={`No active students are enrolled in Class ${cls} (${batch} batch).`}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Roll Number</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {attendance.map((a) => {
                      const currentStatus = records[a.studentId] || 'absent'
                      return (
                        <tr key={a.studentId} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-gray-800 text-xs">
                            {a.rollNumber || a.studentId}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-gray-900">{a.studentName}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              {STATUS_OPTS.map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => toggleStatus(a.studentId, opt.value)}
                                  className={cn(
                                    'px-2.5 py-1 rounded-lg text-xs font-bold border transition-all',
                                    currentStatus === opt.value
                                      ? opt.value === 'present'
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                        : opt.value === 'absent'
                                        ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                                        : 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                  )}
                                >
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
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="mt-5 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          {summaryLoading ? (
            <PageLoader />
          ) : !summaryData || summaryData.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No summary data available"
              description="Attendance records will populate here once marked."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-semibold uppercase">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Present</th>
                    <th className="py-3 px-4">Absent</th>
                    <th className="py-3 px-4">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summaryData.map((s) => (
                    <tr key={s.studentId}>
                      <td className="py-3 px-4 font-bold text-gray-900">{s.studentName}</td>
                      <td className="py-3 px-4">{s.total}</td>
                      <td className="py-3 px-4 text-emerald-600 font-semibold">{s.present}</td>
                      <td className="py-3 px-4 text-primary-600 font-semibold">{s.absent}</td>
                      <td className="py-3 px-4 font-bold">
                        <span
                          className={s.percentage >= 75 ? 'text-emerald-600' : 'text-primary-600'}
                        >
                          {s.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Sidebar>
  )
}
