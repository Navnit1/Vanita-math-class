import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, StatCard, Badge } from '@/components/ui'
import { studentService, announcementService, paymentService, materialService, weeklyTestService } from '@/services'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  FileText,
  Calendar,
  Bell,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  CreditCard,
  TrendingDown,
  BookOpen,
  Award,
  Clock,
  Sparkles,
} from 'lucide-react'

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
    queryFn: () => announcementService.getAll({ limit: 4 }),
  })

  const { data: materialsData } = useQuery({
    queryKey: ['my-materials-latest'],
    queryFn: () => materialService.getAll({ limit: 4 }),
  })

  const { data: testData } = useQuery({
    queryKey: ['weeklyTests', 'myResults'],
    queryFn: weeklyTestService.getMyResults,
  })

  if (profileLoading) {
    return (
      <Sidebar>
        <PageLoader />
      </Sidebar>
    )
  }

  const fees = feesData?.fees || []
  const pendingFees = fees.filter((f) => ['pending', 'overdue'].includes(f.paymentStatus))
  const attendance = attendanceData?.stats || {}
  const announcements = announcementsData?.announcements || []
  const latestMaterials = materialsData?.materials || []
  const upcomingTests = testData?.upcomingTests || []
  const testResults = testData?.results || []
  const latestResult = testResults[0]

  const pendingAmount = Math.max(0, (profile?.totalFee || 0) - (profile?.paidFee || 0))
  const lastPayment = payments[0]
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

  return (
    <Sidebar>
      {/* Welcome Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
              <Sparkles className="w-3 h-3 text-primary-600" />
              Student Portal
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Roll No: <strong>{profile?.rollNumber || 'Assigned'}</strong>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {greet}, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Class {profile?.class} · {profile?.batch} Batch · Mathematics by Vanita Rani Gupta
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/test-reports"
            className="btn btn-outline btn-sm border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
          >
            <Award className="w-4 h-4 text-primary-600" /> My Test Marks
          </Link>
          <Link
            to="/dashboard/materials"
            className="btn btn-primary btn-sm flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4" /> Class Notes
          </Link>
        </div>
      </div>

      {/* Dues Alert Banner */}
      {pendingAmount > 0 && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Pending tuition dues: {formatCurrency(pendingAmount)}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Please clear fee dues with the institute or pay online.
              </p>
            </div>
          </div>
          <Link to="/dashboard/fees" className="btn btn-primary btn-sm flex-shrink-0 gap-1">
            <CreditCard className="w-3.5 h-3.5" /> View Fee Dues
          </Link>
        </div>
      )}

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Tuition Fee"
          value={formatCurrency(profile?.totalFee)}
          icon={CreditCard}
          subtext="Annual enrollment"
        />
        <StatCard
          label="Paid Fees"
          value={formatCurrency(profile?.paidFee)}
          icon={CheckCircle}
          subtext={`${payments.length} receipt(s)`}
        />
        <StatCard
          label="Pending Dues"
          value={formatCurrency(pendingAmount)}
          icon={TrendingDown}
          subtext={pendingAmount === 0 ? 'All dues cleared!' : 'Balance outstanding'}
        />
        <StatCard
          label="Attendance"
          value={`${attendance.percentage ?? 0}%`}
          icon={Calendar}
          subtext={`${attendance.present ?? 0} days present`}
        />
      </div>

      {/* Main 2-column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Weekly Tests & Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Latest Test Result & Upcoming Tests */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Weekly Tests & Performance</h2>
                <p className="text-xs text-gray-500">Curated weekly mathematics evaluations</p>
              </div>
              <Link
                to="/dashboard/test-reports"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                All Reports <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-6">
              {latestResult ? (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/80 mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                      Latest Graded Test
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(latestResult.testDate)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{latestResult.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{latestResult.topicsCovered || 'Mathematics'}</p>
                    </div>
                    {latestResult.attendance === 'absent' ? (
                      <Badge variant="danger">Absent</Badge>
                    ) : (
                      <div className="text-right">
                        <div className="flex items-baseline gap-1 justify-end">
                          <span className="text-2xl font-black text-gray-900">{latestResult.marksObtained}</span>
                          <span className="text-xs font-semibold text-gray-400">/ {latestResult.maxMarks}</span>
                        </div>
                        <Badge variant={latestResult.result === 'pass' ? 'success' : 'danger'}>
                          {latestResult.percentage}% · {latestResult.result?.toUpperCase()}
                        </Badge>
                      </div>
                    )}
                  </div>
                  {latestResult.remarks && (
                    <p className="text-xs text-gray-600 italic mt-3 bg-white p-2.5 rounded-lg border border-gray-200/60">
                      "{latestResult.remarks}"
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4">No graded tests yet.</p>
              )}

              {/* Upcoming Tests */}
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                Upcoming Scheduled Tests
              </h3>
              {upcomingTests.length > 0 ? (
                <div className="space-y-3">
                  {upcomingTests.slice(0, 2).map((test) => (
                    <div
                      key={test._id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-primary-200 bg-white shadow-2xs transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{test.title}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(test.testDate)} {test.startTime ? `· ${test.startTime}` : ''}
                          </p>
                          {test.topicsCovered && (
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                              <strong>Syllabus:</strong> {test.topicsCovered}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Max: {test.maxMarks}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">No upcoming tests scheduled for your class right now.</p>
              )}
            </div>
          </div>

          {/* Class Study Notes */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Study Materials & Formula Sheets</h2>
                <p className="text-xs text-gray-500">Accessible through in-website viewer</p>
              </div>
              <Link
                to="/dashboard/materials"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                All Notes <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-6">
              {latestMaterials.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {latestMaterials.map((mat) => (
                    <Link
                      key={mat._id}
                      to="/dashboard/materials"
                      className="p-3.5 rounded-xl border border-gray-100 hover:border-primary-300 hover:bg-gray-50/50 transition-all flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate">{mat.title}</p>
                        <p className="text-xs text-gray-500">
                          {mat.topic || mat.subject || 'Math Notes'} · Class {mat.class}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">No notes uploaded for your standard yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Fees Summary & Announcements */}
        <div className="space-y-6">
          {/* Fee Progress Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Fee Summary</h2>
              <Link to="/dashboard/fees" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                Details
              </Link>
            </div>

            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>Paid: <strong className="text-emerald-600">{formatCurrency(profile?.paidFee)}</strong></span>
              <span>Total: <strong>{formatCurrency(profile?.totalFee)}</strong></span>
            </div>

            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, ((profile?.paidFee || 0) / (profile?.totalFee || 1)) * 100)}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5 text-right font-medium">
              {Math.round(((profile?.paidFee || 0) / (profile?.totalFee || 1)) * 100)}% Cleared
            </p>

            {/* Pending items */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              {pendingFees.length > 0 ? (
                pendingFees.slice(0, 2).map((f) => (
                  <div key={f._id} className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-gray-800">{f.month || f.feeType}</p>
                      <p className="text-[11px] text-gray-400">Due {formatDate(f.dueDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(f.amount)}</p>
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        {f.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold py-1">
                  <CheckCircle className="w-4 h-4" /> All fees paid up to date!
                </div>
              )}
            </div>

            {lastPayment && (
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Last Receipt: {formatDate(lastPayment.paymentDate)}</span>
                <span className="font-bold text-gray-800">{formatCurrency(lastPayment.amount)}</span>
              </div>
            )}
          </div>

          {/* Announcements Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Notice Board</h2>
              <Link to="/dashboard/notices" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                All
              </Link>
            </div>

            <div className="divide-y divide-gray-100">
              {announcements.length > 0 ? (
                announcements.map((a) => (
                  <div key={a._id} className="p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start gap-2.5">
                      <Bell className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-gray-900 leading-snug">{a.title}</p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                          {a.content}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">{formatDate(a.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 p-4 italic">No announcements posted.</p>
              )}
            </div>
          </div>

          {/* Faculty contact info */}
          <div className="bg-primary-50/50 rounded-2xl border border-primary-100 p-5 text-xs text-gray-700">
            <p className="font-bold text-primary-900 text-sm">Vanita Math Classes</p>
            <p className="text-gray-600 mt-1">
              <strong>Faculty:</strong> Vanita Rani Gupta (M.Sc., M.Phil., B.Ed.)
            </p>
            <p className="text-gray-600 mt-0.5">#302, Phase-II, Vishal Nagar, Bathinda</p>
            <p className="text-primary-700 font-bold mt-1">Helpline: +91 98159-62612</p>
          </div>
        </div>
      </div>
    </Sidebar>
  )
}
