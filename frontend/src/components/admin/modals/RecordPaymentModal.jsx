import { useState, useEffect } from 'react'
import { CreditCard, X, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'

const MONTHS_LIST = [
  'April 2026', 'May 2026', 'June 2026', 'July 2026',
  'August 2026', 'September 2026', 'October 2026', 'November 2026',
  'December 2026', 'January 2027', 'February 2027', 'March 2027'
]

export default function RecordPaymentModal({
  isOpen,
  onClose,
  onSavePayment,
  students = [],
  batches = [],
  payments = [],
  settings = {},
  preselectedStudentId = '',
  defaultMonth = 'September 2026',
}) {
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [month, setMonth] = useState(defaultMonth)
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [expectedFee, setExpectedFee] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [amount, setAmount] = useState(0)
  const [paymentMode, setPaymentMode] = useState('UPI')
  const [referenceNo, setReferenceNo] = useState('')
  const [notes, setNotes] = useState('')
  const [recordedBy, setRecordedBy] = useState('Admin (Navnit)')
  const [receiptNo, setReceiptNo] = useState('')

  // Generate next receipt number
  const generateReceiptNo = () => {
    const prefix = settings.receiptPrefix || 'VMC-2026-'
    const count = (payments.length || 0) + 45
    return `${prefix}${String(count).padStart(4, '0')}`
  }

  useEffect(() => {
    if (isOpen) {
      const initialId = preselectedStudentId || (students.length > 0 ? (students[0]._id || students[0].id) : '')
      setSelectedStudentId(initialId)
      setMonth(defaultMonth)
      setPaymentDate(new Date().toISOString().slice(0, 10))
      setReceiptNo(generateReceiptNo())
      setReferenceNo('')
      setNotes('')
    }
  }, [isOpen, preselectedStudentId, students, defaultMonth, settings, payments.length])

  // Recalculate fees when student or month changes
  useEffect(() => {
    if (!selectedStudentId) return
    const student = students.find((s) => (s._id || s.id) === selectedStudentId)
    if (!student) return

    // Calculate base fee from batch or student
    let baseFee = Number(student.monthlyFee || 0)
    if (!baseFee && batches.length > 0) {
      const matchedBatch = batches.find((b) =>
        (student.batchIds || []).includes(b.id || b.batchId) ||
        b.name === student.batch ||
        b.grade === (student.grade || student.class)
      )
      baseFee = matchedBatch ? matchedBatch.monthlyFee : 2500
    }

    const discountPercent = Number(student.discountPercent || 0)
    const discountAmount = discountPercent > 0 ? Math.round((baseFee * discountPercent) / 100) : 0
    const netExpected = Math.max(0, baseFee - discountAmount)

    // Check if partial payments exist for this month
    const paidSoFar = payments
      .filter((p) => {
        const pStudentId = p.studentId?._id || p.studentId || ''
        const curId = student._id || student.id || ''
        return String(pStudentId) === String(curId) && (p.month || '').toLowerCase() === month.toLowerCase()
      })
      .reduce((sum, p) => sum + Number(p.amount || 0), 0)

    const remainingDue = Math.max(0, netExpected - paidSoFar)

    setExpectedFee(netExpected)
    setDiscount(discountAmount)
    setAmount(remainingDue > 0 ? remainingDue : netExpected)
  }, [selectedStudentId, month, students, batches, payments])

  if (!isOpen) return null

  const selectedStudent = students.find((s) => (s._id || s.id) === selectedStudentId)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedStudentId) {
      alert('Please select a student')
      return
    }
    if (amount <= 0) {
      alert('Payment amount must be greater than 0')
      return
    }

    const payload = {
      receiptNo: receiptNo || generateReceiptNo(),
      receiptNumber: receiptNo || generateReceiptNo(),
      studentId: selectedStudentId,
      batchId: selectedStudent?.batchIds?.[0] || selectedStudent?.batch,
      amount: Number(amount),
      expectedFee: Number(expectedFee),
      discount: Number(discount),
      month,
      paymentDate,
      paymentMethod: paymentMode.toLowerCase().replace(/\s+/g, '_'),
      paymentMode,
      transactionId: referenceNo.trim() || undefined,
      referenceNo: referenceNo.trim(),
      notes: notes.trim(),
      recordedBy: recordedBy.trim(),
      approvalStatus: 'approved',
    }

    onSavePayment(payload)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full border border-neutral-200">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <span>Record Fee Collection</span>
            </h2>
            <p className="text-xs text-neutral-500">
              Generate official receipt and log transaction in financial ledger
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          {/* Student Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Select Student <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white font-medium text-neutral-900"
            >
              <option value="" disabled>-- Choose Enrolled Student --</option>
              {students.map((s) => {
                const sId = s._id || s.id
                const sName = s.fullName || s.name
                const sRoll = s.studentId || s.rollNo
                const sGrade = s.class || s.grade
                return (
                  <option key={sId} value={sId}>
                    {sName} ({sRoll}) · {sGrade} · {formatCurrency(s.monthlyFee || expectedFee, settings.currencySymbol)}/mo
                  </option>
                )
              })}
            </select>
          </div>

          {/* Month & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Fee For Month <span className="text-rose-500">*</span>
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              >
                {MONTHS_LIST.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Receipt Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 font-mono border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>
          </div>

          {/* Fee Calculation Breakdown */}
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-600">
              <span>Standard Monthly Fee:</span>
              <span className="font-mono tabular-nums font-semibold text-neutral-900">
                {formatCurrency(expectedFee + discount, settings.currencySymbol)}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-700">
                <span>Concession / Scholarship Discount:</span>
                <span className="font-mono tabular-nums font-semibold">
                  - {formatCurrency(discount, settings.currencySymbol)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs font-bold text-neutral-900 pt-2 border-t border-neutral-200">
              <span>Net Expected Payable:</span>
              <span className="font-mono tabular-nums text-indigo-700 text-sm">
                {formatCurrency(expectedFee, settings.currencySymbol)}
              </span>
            </div>
          </div>

          {/* Amount Received & Receipt Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Amount Received ({settings.currencySymbol || '₹'}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                step="50"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-base font-bold font-mono text-emerald-700 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Receipt Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                className="w-full px-3 py-2 font-mono border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>
          </div>

          {/* Payment Mode & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Payment Mode <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white font-medium"
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Cash">Cash (Front Desk)</option>
                <option value="Bank Transfer">Bank Transfer / IMPS / NEFT</option>
                <option value="Cheque">Cheque</option>
                <option value="Card">Credit / Debit Card</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Transaction Ref / UTR / Remarks
              </label>
              <input
                type="text"
                placeholder="e.g. UPI/8839210192/SBI"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full px-3 py-2 font-mono border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>
          </div>

          {/* Recorded By */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Received & Authorized By
            </label>
            <input
              type="text"
              value={recordedBy}
              onChange={(e) => setRecordedBy(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Save & Generate Receipt
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
