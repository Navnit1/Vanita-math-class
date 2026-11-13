import {
  Sparkles,
  Users,
  CreditCard,
  PenLine,
  Upload,
  ClipboardList,
  Eye,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Receipt,
  FileText,
  Calendar,
  ArrowRight
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/utils/formatters'

export default function DashboardView({
  students = [],
  batches = [],
  payments = [],
  tests = [],
  marks = [],
  notes = [],
  settings = {},
  currentMonth = 'September 2026',
  enquiries = [],
  onOpenRecordPayment,
  onOpenAddStudent,
  onOpenInputMarks,
  onOpenPostNotes,
  onViewReceipt,
  onViewStudent,
  onNavigateTab,
}) {
  const activeStudents = students.filter((s) => s.status === 'active')

  // Total expected monthly fee from active students
  const totalExpectedMonthly = activeStudents.reduce((sum, s) => {
    let fee = Number(s.monthlyFee || 0)
    if (!fee && batches.length > 0) {
      const b = batches.find((item) =>
        (s.batchIds || []).includes(item.id || item.batchId) ||
        item.name === s.batch ||
        item.grade === (s.grade || s.class)
      )
      fee = b ? b.monthlyFee : 2500
    }
    return sum + fee
  }, 0)

  // Payments in current month
  const currentMonthPayments = payments.filter(
    (p) => (p.month || '').toLowerCase() === currentMonth.toLowerCase()
  )
  const currentMonthCollected = currentMonthPayments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  )

  // Students with dues
  const dueBreakdown = activeStudents
    .map((s) => {
      let expected = Number(s.monthlyFee || 0)
      if (!expected && batches.length > 0) {
        const b = batches.find((item) =>
          (s.batchIds || []).includes(item.id || item.batchId) ||
          item.name === s.batch ||
          item.grade === (s.grade || s.class)
        )
        expected = b ? b.monthlyFee : 2500
      }

      const paid = currentMonthPayments
        .filter((p) => {
          const pStudentId = p.studentId?._id || p.studentId || ''
          const curId = s._id || s.id || ''
          return String(pStudentId) === String(curId)
        })
        .reduce((sum, p) => sum + Number(p.amount || 0), 0)

      const due = Math.max(0, expected - paid)
      return { student: s, expected, paid, due, isFullyPaid: due === 0, isPartiallyPaid: paid > 0 && due > 0 }
    })
    .filter((item) => item.due > 0)

  const totalDueAmount = dueBreakdown.reduce((sum, item) => sum + item.due, 0)
  const collectionPercentage =
    totalExpectedMonthly > 0
      ? Math.min(100, Math.round((currentMonthCollected / totalExpectedMonthly) * 100))
      : 0

  // Grade distributions
  const gradeCards = [
    { grade: '8th Class', label: '8th Class', count: students.filter((s) => (s.class || s.grade) === '8th Class' || (s.class || s.grade) === '8th').length, badgeColor: 'bg-blue-100 text-blue-800 border-blue-200' },
    { grade: '9th Class', label: '9th Class', count: students.filter((s) => (s.class || s.grade) === '9th Class' || (s.class || s.grade) === '9th').length, badgeColor: 'bg-teal-100 text-teal-800 border-teal-200' },
    { grade: '10th Class', label: '10th (Board)', count: students.filter((s) => (s.class || s.grade) === '10th Class' || (s.class || s.grade) === '10th').length, badgeColor: 'bg-amber-100 text-amber-800 border-amber-200' },
    { grade: '+1 (11th) Mathematics', label: '+1 (11th)', count: students.filter((s) => (s.class || s.grade) === '+1 (11th) Mathematics' || (s.class || s.grade) === '+1').length, badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    { grade: '+2 (12th) Mathematics', label: '+2 (12th Board)', count: students.filter((s) => (s.class || s.grade) === '+2 (12th) Mathematics' || (s.class || s.grade) === '+2').length, badgeColor: 'bg-rose-100 text-rose-800 border-rose-200' },
  ]

  // Recent 5 receipts
  const recentReceipts = [...payments]
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    .slice(0, 5)

  const newEnquiries = enquiries.filter((e) => e.status === 'new')

  return (
    <div className="space-y-6">
      {/* Red/Rose Gradient Hero Card */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-48 h-48 bg-rose-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6 text-center md:text-left">
            <div className="bg-white p-2.5 rounded-2xl shadow-md shrink-0 flex items-center justify-center">
              <img
                src="/vmc-logo.svg"
                alt="VMC Logo"
                className="h-12 sm:h-16 w-auto object-contain"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-xs font-bold tracking-wide text-rose-100 mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{settings.tagline || 'Mathmatics tuition classes for 8th, 9th, 10th, +1 & +2'}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black uppercase font-serif tracking-tight drop-shadow-xs text-white">
                {settings.centerName || 'VANITA MATH CLASSES'}
              </h1>
              <p className="text-xs sm:text-sm text-rose-100 font-medium mt-1">
                Faculty: <strong className="text-white">{settings.facultyName || 'Vanita Rani Gupta (M.Sc, M.Phil, B.Ed, 17+ yrs exp)'}</strong>
              </p>
              <p className="text-xs text-rose-200 mt-0.5">
                {settings.address || '#302, Phase-II, Vishal Nagar, Bathinda'} · Contact: {settings.phone || '98159-62612'} · {settings.email || 'singla_vikas123@yahhoo.com'}
              </p>
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-xl p-3 sm:p-4 text-center shrink-0 min-w-[170px]">
            <span className="text-[11px] font-semibold text-rose-200 block uppercase tracking-wider">
              Active Billing Cycle
            </span>
            <span className="text-lg sm:text-xl font-black font-mono text-white block mt-0.5">
              {currentMonth}
            </span>
            <span className="text-[11px] text-emerald-300 font-bold block mt-0.5">
              {collectionPercentage}% Fees Received
            </span>
          </div>
        </div>

        {/* New Enquiries Notification Banner */}
        {newEnquiries.length > 0 && (
          <div className="mt-4 p-3 bg-amber-400 text-amber-950 font-bold text-xs rounded-xl flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-900 shrink-0" />
              <span>{newEnquiries.length} New Admission Enquiry Received from Website Home Page!</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('enquiries')}
              className="px-3 py-1 bg-amber-950 text-white rounded-lg text-xs hover:bg-black transition-colors cursor-pointer shrink-0"
            >
              View Enquiries →
            </button>
          </div>
        )}

        {/* 6 Quick Action Cards */}
        <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            type="button"
            onClick={onOpenRecordPayment}
            style={{ backgroundColor: '#10b981', color: '#064e3b' }}
            className="flex items-center justify-center gap-1.5 py-3 px-3 hover:bg-emerald-400 active:bg-emerald-600 font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer hover:scale-[1.02]"
            title="Record student monthly fee"
          >
            <CreditCard className="w-4 h-4 shrink-0 text-emerald-950" />
            <span className="font-extrabold text-emerald-950">+ Record Fee</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddStudent}
            style={{ backgroundColor: '#ffffff', color: '#171717' }}
            className="flex items-center justify-center gap-1.5 py-3 px-3 hover:bg-neutral-100 active:bg-neutral-200 font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer hover:scale-[1.02]"
            title="Register new student"
          >
            <Users className="w-4 h-4 shrink-0 text-red-600" />
            <span className="font-extrabold text-neutral-900">+ Add Student</span>
          </button>

          <button
            type="button"
            onClick={onOpenInputMarks || (() => onNavigateTab('tests'))}
            style={{ backgroundColor: '#fbbf24', color: '#451a03' }}
            className="flex items-center justify-center gap-1.5 py-3 px-3 hover:bg-amber-300 active:bg-amber-500 font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer hover:scale-[1.02]"
            title="Input weekly test marks"
          >
            <PenLine className="w-4 h-4 shrink-0 text-amber-950" />
            <span className="font-extrabold text-amber-950">✍️ Input Marks</span>
          </button>

          <button
            type="button"
            onClick={onOpenPostNotes || (() => onNavigateTab('notes'))}
            style={{ backgroundColor: '#38bdf8', color: '#082f49' }}
            className="flex items-center justify-center gap-1.5 py-3 px-3 hover:bg-sky-300 active:bg-sky-500 font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer hover:scale-[1.02]"
            title="Upload PDF notes or formula sheets"
          >
            <Upload className="w-4 h-4 shrink-0 text-sky-950" />
            <span className="font-extrabold text-sky-950">📤 Upload Notes</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('tests')}
            style={{ backgroundColor: '#a855f7', color: '#ffffff' }}
            className="flex items-center justify-center gap-1.5 py-3 px-3 hover:bg-purple-400 active:bg-purple-600 font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer hover:scale-[1.02]"
            title="Weekly test records"
          >
            <ClipboardList className="w-4 h-4 shrink-0 text-white" />
            <span className="font-extrabold text-white">Weekly Tests ({tests.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('dues')}
            style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
            className="flex items-center justify-center gap-1.5 py-3 px-3 hover:bg-red-400 active:bg-red-600 font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer hover:scale-[1.02]"
            title="View fee dues and WhatsApp reminder"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-white" />
            <span className="font-extrabold text-white">Due Fees ({dueBreakdown.length})</span>
          </button>
        </div>
      </div>

      {/* 4 Key Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Students */}
        <div
          onClick={() => onNavigateTab('students')}
          className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Active Enrolled Students
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-neutral-900 font-mono">
              {activeStudents.length}
            </span>
            <span className="text-xs text-neutral-500 font-medium">Total registered</span>
          </div>
          <div className="mt-3 flex gap-1.5 flex-wrap">
            {gradeCards.map((g) => (
              <span key={g.grade} className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${g.badgeColor}`}>
                {g.count} in {g.label}
              </span>
            ))}
          </div>
        </div>

        {/* Fees Collected Current Month */}
        <div
          onClick={() => onNavigateTab('ledger')}
          className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              {currentMonth} Collected
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
              {formatCurrency(currentMonthCollected, settings.currencySymbol)}
            </span>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>Expected: {formatCurrency(totalExpectedMonthly, settings.currencySymbol)}</span>
              <span className="font-bold text-emerald-700">{collectionPercentage}%</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${collectionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Pending Due Fees */}
        <div
          onClick={() => onNavigateTab('dues')}
          className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Total Due This Month
            </span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 font-mono">
              {formatCurrency(totalDueAmount, settings.currencySymbol)}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-3">
            <strong className="text-rose-700">{dueBreakdown.length} students</strong> pending payment
          </p>
        </div>

        {/* Batches & Weekly Testing */}
        <div
          onClick={() => onNavigateTab('batches')}
          className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Active Batches & Tests
            </span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-neutral-900 font-mono">
              {batches.length}
            </span>
            <span className="text-xs text-neutral-500 font-medium">Batches · {tests.length} Tests</span>
          </div>
          <p className="text-xs text-neutral-500 mt-3">
            Hall A & Hall B (Smart Classrooms)
          </p>
        </div>
      </div>

      {/* Main Two-Column Row: Recent Fee Receipts & Upcoming Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Recent Fee Receipts */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Recent Fee Receipts & Transactions</h2>
              <p className="text-xs text-neutral-500">Official slips logged in real-time</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('ledger')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentReceipts.length === 0 ? (
            <p className="text-xs text-neutral-400 py-8 text-center bg-neutral-50 rounded-lg">
              No transactions recorded yet. Click "+ Record Fee" to issue a receipt.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 font-semibold">
                    <th className="py-2.5 px-3">Receipt #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {recentReceipts.map((p) => {
                    const studentObj = students.find((s) => {
                      const pId = p.studentId?._id || p.studentId || ''
                      const sId = s._id || s.id || ''
                      return String(pId) === String(sId)
                    }) || p.studentId || {}

                    return (
                      <tr key={p._id || p.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-semibold text-neutral-900">
                          {p.receiptNumber || p.receiptNo}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-500">{formatDate(p.paymentDate)}</td>
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => onViewStudent && onViewStudent(studentObj)}
                            className="font-bold text-neutral-900 hover:text-indigo-600 text-left cursor-pointer"
                          >
                            {studentObj.fullName || studentObj.name || 'Student'}
                          </button>
                          <span className="block text-[11px] text-neutral-400">
                            {studentObj.studentId || studentObj.rollNo} · {studentObj.class || studentObj.grade}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900">
                          {formatCurrency(p.amount, settings.currencySymbol)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-700">
                            {p.paymentMethod || p.paymentMode}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => onViewReceipt && onViewReceipt(p, studentObj)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column (1 span): Upcoming Tests & Study Materials */}
        <div className="space-y-6">
          {/* Upcoming Tests */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-900">Scheduled Weekly Tests</h2>
              <button
                type="button"
                onClick={() => onNavigateTab('tests')}
                className="text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
              >
                All Tests →
              </button>
            </div>
            {tests.length === 0 ? (
              <p className="text-xs text-neutral-400 py-4 text-center bg-neutral-50 rounded-lg">
                No tests scheduled yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {tests.slice(0, 3).map((t) => (
                  <div
                    key={t._id || t.id}
                    onClick={() => onNavigateTab('tests')}
                    className="p-3 bg-neutral-50 hover:bg-neutral-100/80 rounded-lg border border-neutral-200 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900">{t.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-semibold">
                        {t.class || t.grade}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1 line-clamp-1">
                      Topics: {t.topicsCovered || t.topic}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-600 font-mono">
                      <span>Date: {formatDate(t.testDate)}</span>
                      <span className="font-bold">Max: {t.maxMarks} Marks</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Enquiries Glance */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-900">Recent Admission Leads</h2>
              <button
                type="button"
                onClick={() => onNavigateTab('enquiries')}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 cursor-pointer"
              >
                View ({enquiries.length}) →
              </button>
            </div>
            {enquiries.length === 0 ? (
              <p className="text-xs text-neutral-400 py-4 text-center bg-neutral-50 rounded-lg">
                No inquiries submitted yet.
              </p>
            ) : (
              <div className="space-y-2">
                {enquiries.slice(0, 3).map((enq) => (
                  <div
                    key={enq._id || enq.id}
                    className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-neutral-900">{enq.name || enq.studentName}</p>
                      <p className="text-[11px] text-neutral-500">{enq.class || enq.grade} · Tel: {enq.phone}</p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        enq.status === 'new'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {enq.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
