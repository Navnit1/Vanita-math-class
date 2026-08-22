import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, StatCard, SectionCard, Badge } from '@/components/ui'
import { studentService, announcementService, paymentService, materialService } from '@/services'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { DollarSign, Calendar, Bell, ArrowRight, CheckCircle, AlertCircle, CreditCard, TrendingDown, FileText, ClipboardList } from 'lucide-react'

export default function StudentDashboard() {
  const { user } = useAuth()

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: studentService.getMyProfile,
  })

  const { data: feesData } = useQuery({
    queryKey: ['my-fees'],
    queryFn: studentService.getMyFees,
  })

  const { data: payments = [] } = useQuery({
    queryKey: ['my-payments'],
    queryFn: paymentService.getMyPayments,
  })

  const { data: attendanceData } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: () => studentService.getMyAttendance({}),
  })

  const { data: announcementsData } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementService.getAll({ limit: 5 }),
  })

  const { data: materialsData } = useQuery({
    queryKey: ['my-materials-latest'],
    queryFn: () => materialService.getAll({ limit: 4 }),
  })

  if (profileLoading) return <Sidebar><PageLoader /></Sidebar>

  const fees = feesData?.fees || []
  const pendingFees = fees.filter(f => ['pending', 'overdue'].includes(f.paymentStatus))
  const attendance = attendanceData?.stats || {}
  const announcements = announcementsData?.announcements || []
  const latestMaterials = materialsData?.materials || []
  const upcomingTests = announcements.filter(a =>
    /test|exam|assessment/i.test(a.title) || /test|exam|assessment/i.test(a.content)
  ).slice(0, 3)

  const pendingAmount = Math.max(0, (profile?.totalFee || 0) - (profile?.paidFee || 0))
  const lastPayment = payments[0]
  const greet = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'

  return (
    <Sidebar>
      <div className="page-header">
        <h1 className="page-title">Good {greet}, {user?.name?.split(' ')[0]}!</h1>
        <p className="page-subtitle">{profile?.class} · {profile?.batch} batch · {profile?.course || 'Mathematics'}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Fee"
          value={formatCurrency(profile?.totalFee)}
          icon={DollarSign}
          color="blue"
          subtitle="Annual fee"
        />
        <StatCard
          title="Paid Fee"
          value={formatCurrency(profile?.paidFee)}
          icon={CheckCircle}
          color="green"
          subtitle={`${payments.length} payment(s)`}
        />
        <StatCard
          title="Pending Fee"
          value={formatCurrency(pendingAmount)}
          icon={TrendingDown}
          color={pendingAmount === 0 ? 'green' : 'orange'}
          subtitle={pendingAmount === 0 ? 'All clear!' : 'Outstanding'}
        />
        <StatCard
          title="Fee Status"
          value={profile?.feeStatus ? profile.feeStatus.charAt(0).toUpperCase() + profile.feeStatus.slice(1) : '—'}
          icon={profile?.feeStatus === 'paid' ? CheckCircle : AlertCircle}
          color={profile?.feeStatus === 'paid' ? 'green' : profile?.feeStatus === 'partial' ? 'orange' : 'red'}
          subtitle={lastPayment ? `Last: ${formatDate(lastPayment.paymentDate)}` : 'No payments yet'}
        />
      </div>

      {/* Pay Now banner */}
      {pendingAmount > 0 && (
        <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl px-5 py-4 mb-5">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-800">
                Pending fee: {formatCurrency(pendingAmount)}
              </p>
              <p className="text-xs text-orange-600 mt-0.5">Pay online instantly via Razorpay</p>
            </div>
          </div>
          <Link to="/dashboard/fees" className="btn btn-primary btn-sm flex-shrink-0 gap-1">
            <CreditCard className="w-3.5 h-3.5" /> Pay Now
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Fee progress */}
        <SectionCard
          title="Fee Progress"
          action={
            <Link to="/dashboard/fees" className="text-xs text-primary-600 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          <div className="p-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">Paid: <strong className="text-green-600">{formatCurrency(profile?.paidFee)}</strong></span>
              <span className="text-slate-600">Total: <strong>{formatCurrency(profile?.totalFee)}</strong></span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', profile?.feeStatus === 'paid' ? 'bg-green-500' : 'bg-primary-600')}
                style={{ width: `${Math.min(100, ((profile?.paidFee || 0) / (profile?.totalFee || 1)) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2 text-right">
              {Math.round(((profile?.paidFee || 0) / (profile?.totalFee || 1)) * 100)}% completed
            </p>

            <div className="mt-4 space-y-2">
              {pendingFees.slice(0, 3).map(f => (
                <div key={f._id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm text-slate-800">{f.month || f.feeType}</p>
                    <p className="text-xs text-slate-500">Due {formatDate(f.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{formatCurrency(f.amount)}</p>
                    <Badge variant={f.paymentStatus === 'overdue' ? 'red' : 'yellow'}>{f.paymentStatus}</Badge>
                  </div>
                </div>
              ))}
              {pendingFees.length === 0 && (
                <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> All fees paid!
                </p>
              )}
            </div>

            {/* Recent payments */}
            {lastPayment && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-2">Last Payment</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{formatCurrency(lastPayment.amount)}</p>
                    <p className="text-xs text-slate-500">{formatDate(lastPayment.paymentDate)}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    lastPayment.paymentType === 'online'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {lastPayment.paymentType === 'online' ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Attendance overview */}
        <SectionCard
          title="Attendance Overview"
          action={
            <Link to="/dashboard/attendance" className="text-xs text-primary-600 font-medium flex items-center gap-1">
              Details <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          <div className="p-5">
            <div className="flex justify-center">
              <div className="relative w-28 h-28">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none"
                    stroke={attendance.percentage >= 75 ? '#22c55e' : attendance.percentage >= 50 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="3" strokeDasharray={`${attendance.percentage ?? 0} 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-900">{attendance.percentage ?? 0}%</span>
                </div>
              </div>
            </div>
            <div className="flex justify-around mt-4 text-center">
              <div><p className="text-lg font-bold text-green-600">{attendance.present ?? 0}</p><p className="text-xs text-slate-500">Present</p></div>
              <div><p className="text-lg font-bold text-red-500">{attendance.absent ?? 0}</p><p className="text-xs text-slate-500">Absent</p></div>
              <div><p className="text-lg font-bold text-slate-700">{attendance.total ?? 0}</p><p className="text-xs text-slate-500">Total</p></div>
            </div>
            {(attendance.percentage || 0) < 75 && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mt-3 text-center">
                Attendance below 75%. Please improve attendance.
              </p>
            )}
          </div>
        </SectionCard>

        {/* Announcements */}
        <SectionCard
          title="Announcements"
          action={
            <Link to="/dashboard/notices" className="text-xs text-primary-600 font-medium flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          <div className="divide-y divide-slate-50">
            {announcements.slice(0, 4).map(a => (
              <div key={a._id} className="px-5 py-3">
                <div className="flex items-start gap-2">
                  {a.priority === 'high' && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-sm font-medium text-slate-900">{a.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{a.content}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatDate(a.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
            {announcements.length === 0 && (
              <p className="text-sm text-slate-500 px-5 py-4">No announcements.</p>
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        {/* Latest Notes */}
        <SectionCard
          title="Latest Notes"
          action={
            <Link to="/dashboard/materials" className="text-xs text-primary-600 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          <div className="divide-y divide-slate-50">
            {latestMaterials.slice(0, 4).map(m => (
              <div key={m._id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-primary-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{m.title}</p>
                  <p className="text-xs text-slate-500">{m.subject} · {formatDate(m.createdAt)}</p>
                </div>
              </div>
            ))}
            {latestMaterials.length === 0 && (
              <p className="text-sm text-slate-500 px-5 py-4">No notes uploaded yet for your standard.</p>
            )}
          </div>
        </SectionCard>

        {/* Upcoming Tests (surfaced from test/exam-related announcements) */}
        <SectionCard title="Upcoming Tests">
          <div className="divide-y divide-slate-50">
            {upcomingTests.map(a => (
              <div key={a._id} className="px-5 py-3 flex items-start gap-2">
                <ClipboardList className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{a.content}</p>
                </div>
              </div>
            ))}
            {upcomingTests.length === 0 && (
              <p className="text-sm text-slate-500 px-5 py-4">No upcoming tests announced.</p>
            )}
          </div>
        </SectionCard>
      </div>
    </Sidebar>
  )
}
