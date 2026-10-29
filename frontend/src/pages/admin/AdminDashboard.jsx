import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import { StatCard, PageLoader, ErrorState, SectionCard, Avatar, Badge } from '@/components/ui'
import { adminService } from '@/services'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import {
  Users, DollarSign, AlertCircle, TrendingUp, Calendar, BookOpen,
  ClipboardCheck, Mail, PlusCircle, CreditCard, PenTool,
  Upload, ExternalLink, ArrowRight, CheckCircle2, Clock, Phone, RefreshCw
} from 'lucide-react'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [selectedMonth, setSelectedMonth] = useState('')

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-dashboard', selectedMonth],
    queryFn: () => adminService.getDashboard(selectedMonth || undefined),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })

  if (isLoading) return <Sidebar><PageLoader /></Sidebar>

  if (isError) {
    const errorMsg = error?.response?.data?.message || error?.message || 'Failed to load tuition management dashboard'
    return (
      <Sidebar>
        <div className="max-w-xl mx-auto my-12 p-6 sm:p-8 bg-white border border-[#D9DDE3] rounded-2xl shadow-card text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-[#E50914]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#171717]">Tuition Dashboard Connecting...</h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 leading-relaxed">
              {errorMsg}
            </p>
            <div className="text-xs text-[#64748B] mt-3 bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-left space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                <Clock className="w-3.5 h-3.5 text-amber-700" /> Server Connection Notice:
              </p>
              <p>The backend is hosted on Render. When idle, the free-tier service takes ~30–45 seconds to spin up from sleep. If you see this message, the server is waking up now.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="btn btn-primary btn-sm flex items-center gap-2"
            >
              <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
              {isFetching ? 'Connecting to Server...' : 'Try Again'}
            </button>
            <a
              href="https://vanita-math-class.onrender.com/api/health"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Check API Health
            </a>
          </div>
        </div>
      </Sidebar>
    )
  }

  const d = data || {}
  const classCounts = d.classCounts || []
  const pendingDues = d.pendingFeeDues || []
  const recentReceipts = d.recentReceipts || []
  const upcomingTests = d.upcomingTests || []
  const latestTest = d.latestTest
  const recentEnquiries = d.recentEnquiries || []
  const recentNotes = d.recentNotes || []
  const integrations = d.integrations || {}

  return (
    <Sidebar>
      {/* Page Header with Month Picker */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Tuition Management Dashboard</h1>
          <p className="page-subtitle">
            Vanita Math Classes · Overview for <strong>{d.selectedMonthLabel || 'Current Month'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="input text-xs sm:text-sm py-1.5 w-auto"
            title="Filter dashboard statistics by billing month"
          />
          {selectedMonth && (
            <button
              onClick={() => setSelectedMonth('')}
              className="text-xs font-semibold text-[#E50914] hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* QUICK ACTIONS ROW */}
      <div className="mb-6 p-4 bg-white border border-[#D9DDE3] rounded-2xl shadow-card">
        <p className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3">
          Quick Operations
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <button
            onClick={() => navigate('/admin/students?action=new')}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#FFF5F5] border border-[#FFCCD0] text-[#C90019] text-xs font-bold hover:bg-[#FFE5E7] transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-[#E50914]" />
            Add Student
          </button>

          <button
            onClick={() => navigate('/admin/fees?action=record')}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#FFF5F5] border border-[#FFCCD0] text-[#C90019] text-xs font-bold hover:bg-[#FFE5E7] transition-colors shadow-xs"
          >
            <CreditCard className="w-4 h-4 text-[#E50914]" />
            Record Fee
          </button>

          <button
            onClick={() => navigate('/admin/test-reports?tab=marks')}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#FFF5F5] border border-[#FFCCD0] text-[#C90019] text-xs font-bold hover:bg-[#FFE5E7] transition-colors shadow-xs"
          >
            <PenTool className="w-4 h-4 text-[#E50914]" />
            Input Marks
          </button>

          <button
            onClick={() => navigate('/admin/test-reports?tab=schedule')}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#FFF5F5] border border-[#FFCCD0] text-[#C90019] text-xs font-bold hover:bg-[#FFE5E7] transition-colors shadow-xs"
          >
            <Calendar className="w-4 h-4 text-[#E50914]" />
            Schedule Test
          </button>

          <button
            onClick={() => navigate('/admin/materials?action=upload')}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#FFF5F5] border border-[#FFCCD0] text-[#C90019] text-xs font-bold hover:bg-[#FFE5E7] transition-colors shadow-xs col-span-2 sm:col-span-1"
          >
            <Upload className="w-4 h-4 text-[#E50914]" />
            Upload Notes
          </button>
        </div>
      </div>

      {/* CORE TUITION STATS ROW 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard
          title="Active Students"
          value={d.activeStudents ?? 0}
          icon={Users}
          color="red"
          subtitle={`${d.totalStudents ?? 0} total enrolled`}
          onClick={() => navigate('/admin/students')}
        />
        <StatCard
          title="Fees Collected (Month)"
          value={formatCurrency(d.feesCollectedThisMonth ?? 0)}
          icon={TrendingUp}
          color="green"
          subtitle={`${d.selectedMonthLabel || 'Selected Month'} collection`}
          onClick={() => navigate('/admin/payments')}
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(d.totalOutstandingFee ?? 0)}
          icon={AlertCircle}
          color="orange"
          subtitle="Total pending tuition dues"
          onClick={() => navigate('/admin/fees')}
        />
        <StatCard
          title="Students with Dues"
          value={d.studentsWithPendingDuesCount ?? 0}
          icon={DollarSign}
          color="red"
          subtitle="Pending or partial status"
          onClick={() => navigate('/admin/fees')}
        />
      </div>

      {/* CORE TUITION STATS ROW 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="New Enquiries"
          value={d.newEnquiriesCount ?? 0}
          icon={Mail}
          color={d.newEnquiriesCount > 0 ? 'red' : 'slate'}
          subtitle="Awaiting admin follow-up"
          onClick={() => navigate('/admin/inquiries')}
        />
        <StatCard
          title="Weekly Tests"
          value={(d.weeklyTestsScheduled ?? 0) + (d.weeklyTestsCompleted ?? 0)}
          icon={ClipboardCheck}
          color="red"
          subtitle={`${d.weeklyTestsScheduled ?? 0} upcoming · ${d.weeklyTestsCompleted ?? 0} graded`}
          onClick={() => navigate('/admin/test-reports')}
        />
        <StatCard
          title="Math Notes & Formulas"
          value={d.uploadedNotesCount ?? 0}
          icon={BookOpen}
          color="red"
          subtitle="Active PDF materials online"
          onClick={() => navigate('/admin/materials')}
        />
      </div>

      {/* STUDENT ENROLLMENT BY CLASS (8th, 9th, 10th, +1, +2) */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#171717] uppercase tracking-wider">
              Student Strength by Class
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Live count of active mathematics students in each standard
            </p>
          </div>
          <Link to="/admin/students" className="text-xs font-semibold text-[#E50914] hover:underline flex items-center gap-1">
            View Directory <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {classCounts.map(item => (
            <div
              key={item.class}
              onClick={() => navigate(`/admin/students?class=${item.class}`)}
              className="bg-[#FAFAFA] border border-[#D9DDE3] hover:border-[#E50914] rounded-xl p-3.5 text-center cursor-pointer transition-all hover:shadow-xs group"
            >
              <p className="text-xs font-semibold text-[#64748B] group-hover:text-[#E50914] transition-colors">
                Class {item.class}
              </p>
              <p className="text-2xl font-extrabold text-[#171717] mt-1">
                {item.count}
              </p>
              <p className="text-[10px] text-[#64748B] mt-0.5">Students</p>
            </div>
          ))}
        </div>
      </div>

      {/* TWO COLUMNS: PENDING DUES & RECENT RECEIPTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pending Fee Dues Table */}
        <SectionCard
          title="Pending Tuition Dues"
          subtitle="Students with overdue or partial balances — Send instant WhatsApp reminder"
          action={
            <Link to="/admin/fees" className="text-xs font-semibold text-[#E50914] hover:underline">
              Manage All Fees
            </Link>
          }
        >
          {pendingDues.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#059669]">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#059669]" />
              <p className="font-bold">All tuition fees are fully cleared!</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F3F4F6] overflow-x-auto">
              {pendingDues.map(s => (
                <div key={s._id} className="p-4 flex items-center justify-between gap-3 hover:bg-[#FAFAFA] transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#171717] truncate">{s.fullName}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-[#64748B]">
                      <span>Roll: <strong>{s.studentId}</strong></span>
                      <span>·</span>
                      <span>Class {s.class} ({s.batch})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-[#C90019]">
                        {formatCurrency(s.pendingAmount)}
                      </p>
                      <p className="text-[10px] text-[#64748B]">Dues pending</p>
                    </div>

                    {s.whatsappLink && (
                      <a
                        href={s.whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm text-[#059669] hover:bg-emerald-50 hover:border-emerald-300 flex items-center gap-1 text-xs"
                        title="Send WhatsApp Fee Reminder"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Reminder
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Recent Fee Receipts */}
        <SectionCard
          title="Recent Fee Receipts"
          subtitle="Latest verified payments recorded in the system"
          action={
            <Link to="/admin/payments" className="text-xs font-semibold text-[#E50914] hover:underline">
              View All Receipts
            </Link>
          }
        >
          {recentReceipts.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748B]">
              No fee payments recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {recentReceipts.map(p => (
                <div key={p._id} className="p-4 flex items-center justify-between gap-3 hover:bg-[#FAFAFA] transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#171717] truncate">
                        {p.studentId?.fullName || 'Student'}
                      </p>
                      <span className="font-mono text-[11px] font-semibold text-[#E50914]">
                        {p.receiptNumber}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Class {p.studentId?.class} · {formatDate(p.paymentDate)} · {p.paymentMethod?.toUpperCase()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-[#059669]">
                      +{formatCurrency(p.amount)}
                    </span>
                    <button
                      onClick={() => navigate(`/admin/payments?highlight=${p.receiptNumber}`)}
                      className="btn btn-secondary btn-sm text-xs py-1"
                    >
                      Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* THREE COLUMNS: UPCOMING TESTS, RECENT ENQUIRIES, RECENT NOTES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Upcoming Tests & Latest Action */}
        <SectionCard
          title="Weekly Tests"
          subtitle={latestTest ? `Latest: ${latestTest.title}` : 'Scheduled tests'}
          action={
            <Link to="/admin/test-reports" className="text-xs font-semibold text-[#E50914] hover:underline">
              All Tests
            </Link>
          }
        >
          <div className="p-4 space-y-3">
            {latestTest && (
              <div className="p-3 bg-[#FFF5F5] border border-[#FFCCD0] rounded-xl text-xs mb-3">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-[#C90019]">Latest Test:</span>
                  <Badge variant={latestTest.status === 'completed' ? 'green' : 'yellow'}>
                    {latestTest.status}
                  </Badge>
                </div>
                <p className="font-semibold text-[#171717] mt-1">{latestTest.title}</p>
                <p className="text-[#64748B] mt-0.5">
                  Class {latestTest.class} · {formatDate(latestTest.testDate)}
                </p>
                <button
                  onClick={() => navigate(`/admin/test-reports?testId=${latestTest._id}`)}
                  className="mt-2 text-xs font-bold text-[#E50914] hover:underline flex items-center gap-1"
                >
                  <PenTool className="w-3 h-3" />
                  {latestTest.status === 'completed' ? 'View / Edit Marks' : 'Enter Test Marks'}
                </button>
              </div>
            )}

            {upcomingTests.length === 0 ? (
              <p className="text-xs text-[#64748B] text-center py-4">No upcoming tests scheduled.</p>
            ) : (
              upcomingTests.slice(0, 3).map(t => (
                <div key={t._id} className="text-xs border-b border-[#F3F4F6] pb-2 last:border-b-0">
                  <div className="flex justify-between">
                    <span className="font-bold text-[#171717]">{t.title}</span>
                    <span className="font-semibold text-[#E50914]">Class {t.class}</span>
                  </div>
                  <p className="text-[#64748B] mt-0.5">
                    {formatDate(t.testDate)} at {t.startTime} · Max: {t.maxMarks}M
                  </p>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        {/* Recent Enquiries */}
        <SectionCard
          title="Recent Enquiries"
          subtitle="New admissions pipeline"
          action={
            <Link to="/admin/inquiries" className="text-xs font-semibold text-[#E50914] hover:underline">
              View All
            </Link>
          }
        >
          <div className="p-4 divide-y divide-[#F3F4F6]">
            {recentEnquiries.length === 0 ? (
              <p className="text-xs text-[#64748B] text-center py-4">No recent enquiries.</p>
            ) : (
              recentEnquiries.slice(0, 4).map(inq => (
                <div key={inq._id} className="py-2.5 first:pt-0 last:pb-0 text-xs flex justify-between items-center">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-[#171717] truncate">{inq.name}</p>
                    <p className="text-[#64748B]">Class {inq.class} · {inq.phone}</p>
                  </div>
                  <Badge variant={inq.status === 'new' ? 'red' : inq.status === 'enrolled' ? 'green' : 'slate'}>
                    {inq.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        {/* Recent Notes */}
        <SectionCard
          title="Study Notes & Formulas"
          subtitle="Class-specific PDF repository"
          action={
            <Link to="/admin/materials" className="text-xs font-semibold text-[#E50914] hover:underline">
              Upload
            </Link>
          }
        >
          <div className="p-4 divide-y divide-[#F3F4F6]">
            {recentNotes.length === 0 ? (
              <p className="text-xs text-[#64748B] text-center py-4">No notes uploaded yet.</p>
            ) : (
              recentNotes.slice(0, 4).map(n => (
                <div key={n._id} className="py-2.5 first:pt-0 last:pb-0 text-xs">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-[#171717] truncate">{n.title}</p>
                    <Badge variant="primary">Class {n.class}</Badge>
                  </div>
                  <p className="text-[#64748B] mt-0.5 truncate">
                    {n.topic || n.chapter || 'Formula Sheet'}
                  </p>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      {/* INTEGRATIONS STATUS FOOTER PILL */}
      <div className="p-4 bg-white border border-[#D9DDE3] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#171717]">Communication Status:</span>
          <span className="flex items-center gap-1.5">
            <span className={cn('w-2 h-2 rounded-full', integrations.whatsapp?.configured ? 'bg-[#059669]' : 'bg-amber-400')} />
            WhatsApp Cloud API: <strong>{integrations.whatsapp?.configured ? 'Connected' : 'Free Direct Links Ready'}</strong>
          </span>
          <span className="text-[#D9DDE3]">|</span>
          <span className="flex items-center gap-1.5">
            <span className={cn('w-2 h-2 rounded-full', integrations.email?.configured ? 'bg-[#059669]' : 'bg-amber-400')} />
            Email OTP: <strong>{integrations.email?.configured ? integrations.email.provider : 'Admin-Assisted Ready'}</strong>
          </span>
        </div>

        <p className="text-[#64748B]">
          Vanita Math Classes · Bathinda · 98159-62612
        </p>
      </div>
    </Sidebar>
  )
}
