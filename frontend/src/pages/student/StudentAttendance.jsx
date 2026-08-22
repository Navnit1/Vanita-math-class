import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, EmptyState, Badge } from '@/components/ui'
import { studentService } from '@/services'
import { cn } from '@/lib/utils'
import { Calendar, CheckCircle, XCircle, Clock, List, LayoutGrid } from 'lucide-react'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'

const STATUS_MAP = {
  present: { label: 'Present', color: 'bg-green-500', badge: 'green' },
  late: { label: 'Late', color: 'bg-yellow-400', badge: 'yellow' },
  absent: { label: 'Absent', color: 'bg-red-400', badge: 'red' },
  excused: { label: 'Excused', color: 'bg-blue-400', badge: 'blue' },
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
    attendance.forEach(a => { map[format(parseISO(a.date), 'yyyy-MM-dd')] = a.status })
    return map
  }, [attendance])

  const calendarDays = useMemo(() => {
    const start = startOfMonth(new Date(year, month - 1))
    const end = endOfMonth(start)
    const days = eachDayOfInterval({ start, end })
    const leadingBlanks = getDay(start) // 0 = Sunday
    return { days, leadingBlanks }
  }, [month, year])

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

  return (
    <Sidebar>
      <div className="page-header">
        <h1 className="page-title">My Attendance</h1>
        <p className="page-subtitle">Track your class attendance record</p>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div>
          <label className="label">Month</label>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="input w-36">
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Year</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="input w-24">
            {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <div className="stat-card">
          <p className="text-xs text-slate-500">Total Classes</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total ?? 0}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500">Present</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.present ?? 0}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500">Absent</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{stats.absent ?? 0}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500">Percentage</p>
          <p className={cn('text-2xl font-bold mt-1', stats.percentage >= 75 ? 'text-green-600' : 'text-red-500')}>{stats.percentage ?? 0}%</p>
        </div>
      </div>

      {stats.percentage < 75 && stats.total > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <XCircle className="w-4 h-4" />
          Your attendance is below 75%. Please ensure regular attendance to maintain eligibility.
        </div>
      )}
      {stats.percentage >= 75 && stats.total > 0 && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Great! Your attendance is above 75%.
        </div>
      )}

      {/* View toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setView('calendar')} className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
          view === 'calendar' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300')}>
          <LayoutGrid className="w-3.5 h-3.5" /> Calendar
        </button>
        <button onClick={() => setView('list')} className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
          view === 'list' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300')}>
          <List className="w-3.5 h-3.5" /> List
        </button>
      </div>

      {isLoading ? <PageLoader /> : view === 'calendar' ? (
        <div className="card p-5">
          {attendance.length === 0 ? (
            <EmptyState icon={Calendar} title="No attendance records" description={`No attendance data for ${MONTHS[month - 1]} ${year}`} />
          ) : (
            <>
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: calendarDays.leadingBlanks }).map((_, i) => <div key={`b${i}`} />)}
                {calendarDays.days.map(d => {
                  const key = format(d, 'yyyy-MM-dd')
                  const status = statusByDay[key]
                  const info = status ? STATUS_MAP[status] : null
                  return (
                    <div key={key} className={cn(
                      'aspect-square rounded-lg flex flex-col items-center justify-center text-sm border transition-colors',
                      info ? `${info.color} text-white border-transparent font-medium` : 'bg-slate-50 text-slate-400 border-slate-100'
                    )}>
                      {format(d, 'd')}
                    </div>
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-slate-100">
                {Object.entries(STATUS_MAP).map(([key, info]) => (
                  <span key={key} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <span className={cn('w-2.5 h-2.5 rounded-full', info.color)} />
                    {info.label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
      <div className="table-container">
        {attendance.length === 0 ? (
          <EmptyState icon={Calendar} title="No attendance records" description={`No attendance data for ${MONTHS[month - 1]} ${year}`} />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map(a => {
                const d = parseISO(a.date)
                const info = STATUS_MAP[a.status] || STATUS_MAP.absent
                return (
                  <tr key={a._id}>
                    <td className="font-medium text-sm text-slate-900">{format(d, 'dd MMM yyyy')}</td>
                    <td className="text-sm text-slate-500">{format(d, 'EEEE')}</td>
                    <td>
                      <Badge variant={info.badge}>{info.label}</Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      )}
    </Sidebar>
  )
}
