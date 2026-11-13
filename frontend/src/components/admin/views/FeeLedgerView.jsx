import { useState, useMemo } from 'react'
import {
  FileText,
  Plus,
  Download,
  Search,
  Receipt,
  Trash2,
  DollarSign,
  TrendingUp,
  CreditCard,
  X
} from 'lucide-react'
import { formatCurrency, formatDate, exportToCsv } from '@/utils/formatters'

export default function FeeLedgerView({
  payments = [],
  students = [],
  batches = [],
  settings = {},
  onOpenRecordPayment,
  onViewReceipt,
  onDeletePayment,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [monthFilter, setMonthFilter] = useState('all')
  const [modeFilter, setModeFilter] = useState('all')

  const currencySymbol = settings?.currencySymbol || '₹'

  // Extract all distinct months available in payments + standard months
  const availableMonths = useMemo(() => {
    const set = new Set([
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
    ])
    payments.forEach((p) => {
      if (p.month) set.add(p.month)
    })
    return Array.from(set)
  }, [payments])

  // Filtered payments
  const filteredPayments = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    return payments.filter((p) => {
      const student = students.find((s) => (s.id || s._id) === p.studentId)
      const name = student?.name?.toLowerCase() || ''
      const rollNo = student?.rollNo?.toLowerCase() || ''
      const receiptNo = (p.receiptNo || '').toLowerCase()
      const refNo = (p.referenceNo || '').toLowerCase()

      const matchesSearch =
        !q ||
        name.includes(q) ||
        rollNo.includes(q) ||
        receiptNo.includes(q) ||
        refNo.includes(q)

      const matchesMonth = monthFilter === 'all' || p.month === monthFilter
      const matchesMode = modeFilter === 'all' || p.paymentMode === modeFilter

      return matchesSearch && matchesMonth && matchesMode
    })
  }, [payments, students, searchTerm, monthFilter, modeFilter])

  // Aggregated totals
  const totalCollections = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  }, [filteredPayments])

  const avgTransaction =
    filteredPayments.length > 0
      ? Math.round(totalCollections / filteredPayments.length)
      : 0

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Receipt No',
      'Payment Date',
      'Student Roll No',
      'Student Name',
      'Month/Period',
      'Amount Paid (₹)',
      'Payment Mode',
      'Reference No',
      'Discount (₹)',
      'Recorded By',
      'Notes'
    ]
    const rows = filteredPayments.map((p) => {
      const student = students.find((s) => (s.id || s._id) === p.studentId)
      return [
        p.receiptNo || '',
        p.paymentDate || '',
        student?.rollNo || '',
        student?.name || 'Unknown',
        p.month || '',
        p.amount || 0,
        p.paymentMode || 'Cash',
        p.referenceNo || '',
        p.discount || 0,
        p.recordedBy || 'Admin',
        p.notes || ''
      ]
    })
    exportToCsv(
      `vmc_fee_ledger_${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows
    )
  }

  const resetFilters = () => {
    setSearchTerm('')
    setMonthFilter('all')
    setModeFilter('all')
  }

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
            <span className="flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5 text-red-600" />
              Accounting Ledger
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{payments.length} Lifetime Receipts</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
            Fee Collection Ledger
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Audit trail of all recorded tuition fees, payment modes, and printable receipts
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-neutral-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenRecordPayment}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-medium">Filtered Total Collections</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              ₹
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-2 tabular-nums">
            {formatCurrency(totalCollections, currencySymbol)}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Across {filteredPayments.length} transactions
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-medium">Receipts Count</span>
            <Receipt className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 mt-2 tabular-nums">
            {filteredPayments.length} receipts
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            {payments.length} total recorded
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-medium">Average Transaction Size</span>
            <TrendingUp className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 mt-2 tabular-nums">
            {formatCurrency(avgTransaction, currencySymbol)}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">Per fee voucher</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-3 sm:p-4 space-y-3 shadow-2xs">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by receipt #, student name, roll no, ref ID..."
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

          <div className="w-full md:w-52">
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              aria-label="Filter by Billing Month"
              className="w-full px-3 py-2 text-xs sm:text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white"
            >
              <option value="all">All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-48">
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              aria-label="Filter by Payment Mode"
              className="w-full px-3 py-2 text-xs sm:text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white"
            >
              <option value="all">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="Bank Transfer">Bank Transfer / NEFT</option>
              <option value="Cheque">Cheque</option>
              <option value="Card">Card</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-neutral-500 flex items-center justify-between pt-2 border-t border-neutral-100">
          <span>
            Showing {filteredPayments.length} of {payments.length} transactions
          </span>
          {(searchTerm || monthFilter !== 'all' || modeFilter !== 'all') && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-red-600 hover:text-red-800 font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/75 text-xs font-semibold text-neutral-600">
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Student & Roll No</th>
                <th className="py-3 px-4">Fee Month</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4">Reference No</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs sm:text-sm">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500">
                    <Receipt className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-neutral-800">No fee payment records found.</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Try changing filter values or record a new fee payment.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const pId = p.id || p._id
                  const student = students.find((s) => (s.id || s._id) === p.studentId)

                  return (
                    <tr key={pId} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-neutral-900">
                        {p.receiptNo || 'VMC-REC'}
                      </td>
                      <td className="py-3 px-4 text-neutral-600 text-xs whitespace-nowrap">
                        {formatDate(p.paymentDate)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-900">
                          {student?.name || 'Unknown Student'}
                        </div>
                        <div className="text-xs font-mono text-neutral-500">
                          {student?.rollNo || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-neutral-800">{p.month}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-mono px-2 py-0.5 bg-neutral-100 text-neutral-800 rounded">
                          {p.paymentMode || 'Cash'}
                        </span>
                      </td>
                      <td
                        className="py-3 px-4 font-mono text-neutral-500 text-xs truncate max-w-[140px]"
                        title={p.referenceNo}
                      >
                        {p.referenceNo || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 tabular-nums">
                        {formatCurrency(p.amount, currencySymbol)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewReceipt && onViewReceipt(p)}
                            title="Print / View Official Receipt"
                            className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this payment receipt?')) {
                                onDeletePayment && onDeletePayment(pId)
                              }
                            }}
                            title="Delete Record"
                            className="p-1 text-neutral-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
