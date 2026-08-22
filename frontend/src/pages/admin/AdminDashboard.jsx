import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'
import Sidebar from '@/components/layout/Sidebar'
import { StatCard, PageLoader, ErrorState, SectionCard, Avatar } from '@/components/ui'
import { adminService } from '@/services'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Users, DollarSign, AlertCircle, TrendingUp, UserCheck, ArrowRight, Wifi, WifiOff, CreditCard, BookOpen, Bell, Activity } from 'lucide-react'

const PIE_COLORS = { paid: '#22c55e', partial: '#f59e0b', pending: '#94a3b8', overdue: '#ef4444' }

export default function AdminDashboard() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminService.getDashboard,
  })

  if (isLoading) return <Sidebar><PageLoader /></Sidebar>
  if (isError) return <Sidebar><ErrorState message="Failed to load dashboard" onRetry={refetch} /></Sidebar>

  const d = data || {}
  const feeStatusData = (d.feeOverview || []).map(item => ({
    name: item._id,
    value: item.amount,
    count: item.count,
  }))

  return (
    <Sidebar>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of  Vanita Math Classes</p>
      </div>

      {/* Stat cards row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard title="Total Students" value={d.totalStudents} icon={Users} color="blue" subtitle={`${d.activeStudents} active`} />
        <StatCard title="Total Teachers" value={d.totalTeachers} icon={UserCheck} color="purple" />
        <StatCard title="Monthly Revenue" value={formatCurrency(d.monthlyRevenue)} icon={TrendingUp} color="green" trend={d.revenueGrowth} trendLabel="vs last month" />
        <StatCard title="Pending Fees" value={formatCurrency(d.pendingFees)} icon={AlertCircle} color="orange" />
      </div>

      {/* Stat cards row 2 — payment type breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <StatCard title="Total Revenue" value={formatCurrency(d.totalRevenue)} icon={DollarSign} color="green" subtitle="All time collected" />
        <StatCard title="Online Payments" value={formatCurrency(d.onlineRevenue)} icon={Wifi} color="blue" subtitle="Via Razorpay" />
        <StatCard title="Offline Payments" value={formatCurrency(d.offlineRevenue)} icon={WifiOff} color="orange" subtitle="Cash / UPI / Bank" />
      </div>

      {/* Stat cards row 3 — operations stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Attendance %" value={`${d.attendancePercentage ?? 0}%`} icon={Activity} color="green" subtitle="This month overall" />
        <StatCard title="Notes Uploaded" value={d.notesCount ?? 0} icon={BookOpen} color="blue" subtitle="Active study materials" />
        <StatCard title="Active Notices" value={d.notificationsCount ?? 0} icon={Bell} color="purple" subtitle="Live announcements" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Revenue trend chart */}
        <div className="lg:col-span-2">
          <SectionCard title="Revenue — Last 6 Months" subtitle="Online vs Offline collection trend">
            <div className="p-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={d.monthlyChart || []} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="online" name="Online" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="offline" name="Offline" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        {/* Fee status pie */}
        <SectionCard title="Fee Status" subtitle="Collection breakdown">
          <div className="p-4">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={feeStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {feeStatusData.map((entry) => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {feeStatusData.map(item => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[item.name] || '#94a3b8' }} />
                    <span className="text-sm text-slate-600 capitalize">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.value)}</p>
                    <p className="text-xs text-slate-500">{item.count} records</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Recent payments */}
      <SectionCard
        title="Recent Payments"
        subtitle="Latest 5 recorded payments"
        action={
          <Link to="/admin/payments" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        }
      >
        <div className="divide-y divide-slate-50">
          {(d.recentPayments || []).map(p => (
            <div key={p._id} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <Avatar name={p.studentId?.fullName} size="sm" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{p.studentId?.fullName || 'Unknown'}</p>
                  <p className="text-xs text-slate-500">{p.studentId?.studentId} · {formatDate(p.paymentDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  p.paymentType === 'online' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {p.paymentType === 'online' ? 'Online' : 'Offline'}
                </span>
                <p className="text-sm font-semibold text-green-600">{formatCurrency(p.amount)}</p>
              </div>
            </div>
          ))}
          {!d.recentPayments?.length && (
            <p className="text-sm text-slate-500 px-5 py-4">No payments yet.</p>
          )}
        </div>
      </SectionCard>
    </Sidebar>
  )
}
