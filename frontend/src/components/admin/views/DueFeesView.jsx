import { useState, useMemo } from 'react'
import {
  AlertTriangle,
  Download,
  Copy,
  Check,
  Search,
  MessageCircle,
  CreditCard,
  CheckCircle2,
  Phone,
  User,
  X
} from 'lucide-react'
import { formatCurrency, exportToCsv, buildWhatsAppFeeReminder } from '@/utils/formatters'

export default function DueFeesView({
  students = [],
  batches = [],
  payments = [],
  settings = {},
  currentMonth = 'September 2026',
  onRecordPayment,
  onViewStudent,
}) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedSummary, setCopiedSummary] = useState(false)

  const currencySymbol = settings?.currencySymbol || '₹'

  const availableMonths = [
    'September 2026',
    'August 2026',
    'July 2026',
    'June 2026',
    'May 2026',
    'April 2026',
    'October 2026',
    'November 2026',
    'December 2026',
    'January 2027',
    'February 2027',
    'March 2027'
  ]

  // Calculate dues per active student for selected month
  const defaultersList = useMemo(() => {
    return students
      .filter((s) => s.status === 'active')
      .map((student) => {
        const studentId = student.id || student._id

        // Calculate expected fee
        let expectedFee = Number(student.monthlyFee || 0)
        if (!expectedFee && batches.length > 0) {
          const b = batches.find((item) =>
            (student.batchIds || []).includes(item.id || item.batchId) ||
            item.name === student.batch ||
            item.grade === (student.grade || student.class)
          )
          expectedFee = b ? Number(b.monthlyFee || 2500) : 2500
        }
        if (student.discountPercent > 0) {
          expectedFee = Math.round(expectedFee * (1 - student.discountPercent / 100))
        }

        // Sum paid amount for this month
        const paidForMonth = payments
          .filter(
            (p) =>
              p.studentId === studentId &&
              (p.month || '').toLowerCase() === selectedMonth.toLowerCase()
          )
          .reduce((sum, p) => sum + Number(p.amount || 0), 0)

        const balanceDue = Math.max(0, expectedFee - paidForMonth)

        return {
          student,
          monthlyExpected: expectedFee,
          paidForMonth,
          balanceDue,
          isUnpaid: paidForMonth === 0
        }
      })
      .filter((item) => item.balanceDue > 0)
      .sort((a, b) => b.balanceDue - a.balanceDue)
  }, [students, batches, payments, selectedMonth])

  // Filtered by search
  const filteredDefaulters = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return defaultersList
    return defaultersList.filter(({ student }) => {
      const name = (student.name || '').toLowerCase()
      const rollNo = (student.rollNo || '').toLowerCase()
      const guardian = (student.guardianName || '').toLowerCase()
      const gPhone = (student.guardianPhone || '')
      const sPhone = (student.phone || '')
      return (
        name.includes(q) ||
        rollNo.includes(q) ||
        guardian.includes(q) ||
        gPhone.includes(q) ||
        sPhone.includes(q)
      )
    })
  }, [defaultersList, searchTerm])

  const totalOutstanding = useMemo(() => {
    return filteredDefaulters.reduce((acc, curr) => acc + curr.balanceDue, 0)
  }, [filteredDefaulters])

  // Copy Summary to Clipboard
  const handleCopySummary = () => {
    const items = filteredDefaulters.map(
      ({ student, balanceDue }, idx) =>
        `${idx + 1}. ${student.name} (${student.rollNo}) - Due: ${currencySymbol}${balanceDue.toLocaleString('en-IN')} [Parent: ${student.guardianName || 'Guardian'} - ${student.guardianPhone || student.phone || 'N/A'}]`
    )
    const text = `*${settings?.centerName || 'Vanita Math Classes'} - Fee Dues Summary for ${selectedMonth}*\nTotal Due: ${currencySymbol}${totalOutstanding.toLocaleString('en-IN')}\n\n${items.join('\n')}`

    navigator.clipboard.writeText(text)
    setCopiedSummary(true)
    setTimeout(() => setCopiedSummary(false), 2500)
  }

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Roll No',
      'Student Name',
      'Parent Name',
      'Parent Phone',
      'Grade',
      'Fee Month',
      'Expected Fee (₹)',
      'Paid Amount (₹)',
      'Balance Due (₹)'
    ]
    const rows = filteredDefaulters.map(({ student, monthlyExpected, paidForMonth, balanceDue }) => [
      student.rollNo || '',
      student.name || '',
      student.guardianName || '',
      student.guardianPhone || student.phone || '',
      student.grade || student.class || '',
      selectedMonth,
      monthlyExpected,
      paidForMonth,
      balanceDue
    ])
    exportToCsv(`defaulters_${selectedMonth.replace(/\s+/g, '_')}.csv`, headers, rows)
  }

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Fee Recovery & Follow-ups
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-amber-700 font-semibold">
              {filteredDefaulters.length} Pending Students
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
            Due & Overdue Fees
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Identify defaulters, send 1-click WhatsApp reminders, and collect outstanding dues
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg cursor-pointer transition-colors shadow-2xs"
            title="Copy list of all defaulters for administrative review"
          >
            {copiedSummary ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-neutral-500" />
            )}
            <span>{copiedSummary ? 'Copied List!' : 'Copy Summary'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-neutral-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-amber-200 rounded-xl p-4 bg-amber-50/20 shadow-2xs">
          <span className="text-xs text-amber-800 font-semibold block">Total Outstanding Balance</span>
          <div className="text-2xl font-bold font-mono text-amber-900 mt-1 tabular-nums">
            {formatCurrency(totalOutstanding, currencySymbol)}
          </div>
          <span className="text-[11px] text-amber-700 mt-1 block">For {selectedMonth}</span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-neutral-500 font-medium block">Pending Defaulters Count</span>
          <div className="text-2xl font-bold font-mono text-neutral-900 mt-1 tabular-nums">
            {filteredDefaulters.length} students
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">Require follow-up</span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-neutral-500 font-medium block">Fee Billing Month</span>
          <div className="mt-1">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm font-semibold border border-neutral-300 rounded-lg bg-white text-neutral-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-3 sm:p-4 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search defaulter by student name, roll number, or parent contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-neutral-50/50"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Defaulters Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/75 text-xs font-semibold text-neutral-600">
                <th className="py-3 px-4">Student & Roll No</th>
                <th className="py-3 px-4">Class & Parent Details</th>
                <th className="py-3 px-4 text-right">Expected Fee</th>
                <th className="py-3 px-4 text-right">Paid So Far</th>
                <th className="py-3 px-4 text-right">Pending Due</th>
                <th className="py-3 px-4 text-center">Follow-up</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs sm:text-sm">
              {filteredDefaulters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-neutral-500">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <p className="text-base font-bold text-neutral-900">
                      No outstanding dues for {selectedMonth}!
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      All active students have fully cleared their tuition fees for this period.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDefaulters.map(
                  ({ student, monthlyExpected, paidForMonth, balanceDue, isUnpaid }) => {
                    const studentId = student.id || student._id
                    const whatsappUrl = buildWhatsAppFeeReminder(
                      student,
                      settings,
                      balanceDue,
                      [selectedMonth]
                    )

                    return (
                      <tr key={studentId} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => onViewStudent && onViewStudent(student)}
                            className="font-semibold text-neutral-900 hover:text-red-600 text-left block cursor-pointer"
                          >
                            {student.name}
                          </button>
                          <span className="font-mono text-xs text-neutral-500">
                            {student.rollNo}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-neutral-600">
                          <div className="font-medium text-neutral-900">
                            {student.grade || student.class}
                          </div>
                          <div className="text-neutral-500 mt-0.5 flex items-center gap-1">
                            <span>Parent: {student.guardianName || 'Guardian'}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono font-semibold">
                              {student.guardianPhone || student.phone || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-neutral-600 tabular-nums">
                          {formatCurrency(monthlyExpected, currencySymbol)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-neutral-600">
                          {paidForMonth > 0 ? (
                            <span className="text-neutral-800 font-semibold">
                              {formatCurrency(paidForMonth, currencySymbol)}
                            </span>
                          ) : (
                            <span className="text-neutral-400">₹0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm font-bold font-mono text-rose-700 tabular-nums">
                            {formatCurrency(balanceDue, currencySymbol)}
                          </span>
                          <div className="text-[10px] text-neutral-400">
                            {isUnpaid ? 'Full month unpaid' : 'Partially paid'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp Reminder</span>
                          </a>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => onRecordPayment && onRecordPayment(studentId)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition-colors cursor-pointer shadow-sm flex items-center gap-1 ml-auto"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Collect Now</span>
                          </button>
                        </td>
                      </tr>
                    )
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
