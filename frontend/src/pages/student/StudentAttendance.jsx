import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, EmptyState, Badge } from '@/components/ui'
import { studentService } from '@/services'
import { cn } from '@/lib/utils'
import { Calendar, CheckCircle, XCircle, Clock, List, LayoutGrid } from 'lucide-react'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'

const STATUS_MAP = {
  present: { label: 'Present', color: 'bg-emerald-500', badge: 'success' },
  late: { label: 'Late', color: 'bg-amber-400', badge: 'warning' },
  absent: { label: 'Absent', color: 'bg-primary-600', badge: 'danger' },
  excused: { label: 'Excused', color: 'bg-gray-400', badge: 'slate' },
}

export default function StudentAttendance() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [view, setView] = useState('calendar')

  const { data, isLoading } = useQuery({
    queryKey: ['my-attendance', month, year],
    queryFn: () => studentService.getMyAttendance({ month, year }),
  })

  const attendance = data?.attendance || []
  const stats = data?.stats || {}

  const statusByDay = useMemo(() => {
    const map = {}
    attendance.forEach((a) => {
      map[format(parseISO(a.date), 'yyyy-MM-dd')] = a.status
    })
    return map
  }, [attendance])

  const calendarDays = useMemo(() => {
    const start = startOfMonth(new Date(year, month - 1))
    const end = endOfMonth(start)
    const days = eachDayOfInterval({ start, end })
    const leadingBlanks = getDay(start) // 0 = Sunday
    return { days, leadingBlanks }
  }, [month, year])

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  return (
    <Sidebar>
      <div className="page-header">
        <h1 className="page-title">My Attendance Record</h1>
        <p className="page-subtitle">Monthly class attendance log and regularity statistics</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border border-gray-300 rounded-lg text-sm px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border border-gray-300 rounded-lg text-sm px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* View Switch */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setView('calendar')}
            className={cn(
              'px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1',
              view === 'calendar' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-900'
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Calendar
          </button>
          <button
            onClick={() => setView('list')}
            className={cn(
              'px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1',
              view === 'list' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-900'
            )}
          >
            <List className="w-3.5 h-3.5" /> List
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total Classes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Days Present</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.present ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Days Absent</p>
          <p className="text-2xl font-bold text-primary-600 mt-1">{stats.absent ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Attendance %</p>
          <p
            className={cn(
              'text-2xl font-bold mt-1',
              (stats.percentage ?? 0) >= 75 ? 'text-emerald-600' : 'text-primary-600'
            )}
          >
            {stats.percentage ?? 0}%
          </p>
        </div>
      </div>

      {stats.percentage < 75 && stats.total > 0 && (
        <div className="bg-red-50 border border-primary-200 text-primary-800 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0 text-primary-600" />
          Attendance is below 75%. Please ensure regular attendance to achieve top results in mathematics.
        </div>
      )}

      {/* Calendar or List View */}
      {isLoading ? (
        <PageLoader />
      ) : view === 'calendar' ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-gray-500 uppercase">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: calendarDays.leadingBlanks }).map((_, i) => (
              <div key={`blank-${i}`} className="h-16 rounded-xl bg-gray-50/50" />
            ))}

            {calendarDays.days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const status = statusByDay[dateStr]
              const isToday = format(now, 'yyyy-MM-dd') === dateStr

              return (
                <div
                  key={dateStr}
                  className={cn(
                    'h-16 rounded-xl border p-2 flex flex-col justify-between transition-all',
                    isToday ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-100',
                    status === 'present'
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : status === 'absent'
                      ? 'bg-red-50/40 border-red-200'
                      : status === 'late'
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-white'
                  )}
                >
                  <span
                    className={cn(
                      'text-xs font-bold',
                      isToday ? 'text-primary-600' : 'text-gray-700'
                    )}
                  >
                    {format(day, 'd')}
                  </span>

                  {status && (
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded text-center uppercase tracking-wider',
                        status === 'present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : status === 'absent'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      )}
                    >
                      {status}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {attendance.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No records for this month"
              description="Attendance marks will show here once recorded by the admin."
            />
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-semibold uppercase">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendance.map((a) => (
                  <tr key={a._id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {format(parseISO(a.date), 'dd MMMM yyyy (EEEE)')}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={STATUS_MAP[a.status]?.badge || 'slate'}>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">{a.batch || 'Regular'}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">{a.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </Sidebar>
  )
}
