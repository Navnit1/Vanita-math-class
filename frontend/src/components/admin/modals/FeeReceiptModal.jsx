import { useState } from 'react'
import { Printer, X, Check, Copy, Share2 } from 'lucide-react'
import { formatDate, formatCurrency, numberToWords } from '@/utils/formatters'

export default function FeeReceiptModal({
  isOpen,
  onClose,
  payment,
  student,
  batches = [],
  settings = {},
}) {
  const [copied, setCopied] = useState(false)

  if (!isOpen || !payment || !student) return null

  const studentName = student.fullName || student.name || 'Student'
  const rollNo = student.studentId || student.rollNo || 'VMC-101'
  const grade = student.class || student.grade || '10th Class'
  const guardianName = student.parentName || student.guardianName || 'Parent'
  const receiptNo = payment.receiptNumber || payment.receiptNo || 'VMC-2026-0001'
  const amount = Number(payment.amount) || 0
  const expectedFee = Number(payment.expectedFee || student.monthlyFee || amount)
  const discount = Number(payment.discount || 0)
  const balanceDue = Math.max(0, expectedFee - amount)
  const amountInWords = numberToWords(amount)
  const paymentMode = (payment.paymentMethod || payment.paymentMode || 'UPI').toUpperCase()
  const refNo = payment.transactionId || payment.referenceNo || ''

  const enrolledCourseNames = batches
    .filter((b) => (student.batchIds || []).includes(b.id || b.batchId) || b.name === student.batch || b.grade === grade)
    .map((b) => b.name)
    .join(', ') || 'Specialized Mathematics Coaching'

  const handleCopyWhatsApp = () => {
    const text = `*${settings.centerName || 'Vanita Math Classes'}*
*OFFICIAL FEE PAYMENT RECEIPT*
━━━━━━━━━━━━━━━━━━━━━━━
• Receipt No: *${receiptNo}*
• Date: ${formatDate(payment.paymentDate)}
• Student: *${studentName}* (Roll: ${rollNo})
• Class: ${grade}
• Period: *${payment.month || 'Current Month'}*
• Amount Paid: *${settings.currencySymbol || '₹'}${amount.toLocaleString('en-IN')}*
• Payment Mode: ${paymentMode} ${refNo ? `(${refNo})` : ''}
• Balance Due: ${settings.currencySymbol || '₹'}${balanceDue.toLocaleString('en-IN')}
━━━━━━━━━━━━━━━━━━━━━━━
Amount in Words: ${amountInWords}
Received by: ${payment.recordedBy || 'Accounts (Vikas)'}

Thank you for your payment!
${settings.phone ? `Contact: ${settings.phone}` : ''}`

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/70 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[96vh] flex flex-col border border-neutral-200">
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="no-print px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-neutral-600">
              Receipt #{receiptNo}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg cursor-pointer transition-colors"
              title="Copy receipt summary for WhatsApp"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-neutral-500" />
              )}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-200 cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Content Slip */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-neutral-100/60 flex justify-center">
          <div className="printable-card bg-white border border-neutral-300 rounded-lg p-6 sm:p-8 w-full max-w-xl shadow-sm text-neutral-900 text-xs sm:text-sm">
            {/* Receipt Header with Logo */}
            <div className="text-center pb-4 border-b-2 border-red-600">
              <div className="flex justify-center mb-1.5">
                <img
                  src="/vmc-logo.svg"
                  alt="VMC Logo"
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-red-600 uppercase font-serif">
                {settings.centerName || 'VANITA MATH CLASSES'}
              </h1>
              <p className="text-xs font-bold text-neutral-700 mt-0.5 tracking-wide">
                Specialized Mathematics Coaching (8th, 9th, 10th, +1, +2)
              </p>
              <p className="text-[11px] text-neutral-500 mt-1 max-w-md mx-auto leading-relaxed">
                {settings.address || '#302, Phase-II, Vishal Nagar, Bathinda · Head: Er. Vikas'}
              </p>
              <div className="text-[11px] text-neutral-600 font-mono mt-0.5 flex flex-wrap items-center justify-center gap-x-3">
                {settings.phone && <span>Tel: {settings.phone}</span>}
                {settings.email && <span>Email: {settings.email}</span>}
                {settings.upiId && (
                  <span className="text-emerald-700 font-bold">UPI: {settings.upiId}</span>
                )}
              </div>
            </div>

            {/* Official Title Bar */}
            <div className="py-2.5 my-3 bg-neutral-900 text-white text-center rounded">
              <span className="text-xs sm:text-sm font-bold tracking-wider uppercase">
                Official Tuition Fee Receipt
              </span>
            </div>

            {/* Meta Info */}
            <div className="grid grid-cols-2 gap-3 py-2 border-b border-neutral-200 text-xs">
              <div>
                <span className="text-neutral-500">Receipt Number:</span>{' '}
                <strong className="font-mono text-neutral-900">{receiptNo}</strong>
              </div>
              <div className="text-right">
                <span className="text-neutral-500">Date of Issue:</span>{' '}
                <strong className="text-neutral-900">{formatDate(payment.paymentDate)}</strong>
              </div>
              <div>
                <span className="text-neutral-500">Academic Session:</span>{' '}
                <strong className="text-neutral-900">{settings.academicYear || '2026-2027'}</strong>
              </div>
              <div className="text-right">
                <span className="text-neutral-500">Fee Month / Term:</span>{' '}
                <strong className="text-neutral-900">{payment.month || 'September 2026'}</strong>
              </div>
            </div>

            {/* Student Info Card */}
            <div className="my-4 p-3 bg-neutral-50 rounded border border-neutral-200 text-xs space-y-1.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-neutral-500">Student Name:</span>{' '}
                  <strong className="text-neutral-900 text-sm">{studentName}</strong>
                </div>
                <div className="text-right">
                  <span className="text-neutral-500">Roll / Reg No:</span>{' '}
                  <strong className="font-mono text-neutral-900">{rollNo}</strong>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-neutral-500">Class / Grade:</span>{' '}
                  <span className="font-medium text-neutral-800">{grade}</span>
                </div>
                <div className="text-right">
                  <span className="text-neutral-500">Parent/Guardian:</span>{' '}
                  <span className="font-medium text-neutral-800">{guardianName}</span>
                </div>
              </div>
              <div>
                <span className="text-neutral-500">Enrolled Courses:</span>{' '}
                <span className="text-neutral-800">{enrolledCourseNames}</span>
              </div>
            </div>

            {/* Fee Table */}
            <div className="my-4 border border-neutral-200 rounded overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-100 text-neutral-700 font-semibold border-b border-neutral-200">
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-right">Gross Fee</th>
                    <th className="py-2 px-3 text-right">Concession</th>
                    <th className="py-2 px-3 text-right">Net Payable</th>
                    <th className="py-2 px-3 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-neutral-100">
                    <td className="py-2.5 px-3">
                      Mathematics Coaching Tuition Fee ({payment.month || 'Current Month'})
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(expectedFee)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-neutral-500">
                      {discount > 0 ? formatCurrency(discount) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium">
                      {formatCurrency(expectedFee - discount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900">
                      {formatCurrency(amount)}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-neutral-50 font-bold border-t border-neutral-200">
                    <td colSpan={4} className="py-2 px-3 text-right">
                      Total Received:
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-700 text-sm">
                      {formatCurrency(amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Amount In Words & Payment Mode */}
            <div className="space-y-2 py-2 border-b border-neutral-200 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-neutral-500 shrink-0">Amount in Words:</span>
                <strong className="text-neutral-900 capitalize">{amountInWords}</strong>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-neutral-500">Payment Mode:</span>{' '}
                  <span className="font-semibold px-2 py-0.5 bg-neutral-100 rounded text-neutral-800">
                    {paymentMode}
                  </span>
                  {refNo && (
                    <span className="ml-2 font-mono text-neutral-600 text-[11px]">
                      Ref: {refNo}
                    </span>
                  )}
                </div>
                {balanceDue > 0 && (
                  <div className="text-rose-600 font-semibold">
                    Balance Due: {formatCurrency(balanceDue)}
                  </div>
                )}
              </div>
            </div>

            {/* Signatures & Terms */}
            <div className="pt-6 mt-4 flex items-end justify-between text-xs">
              <div className="max-w-xs text-[10px] text-neutral-500 leading-tight">
                <p className="font-semibold text-neutral-700 mb-0.5">Note:</p>
                <p>{settings.termsAndConditions || '1. Fees once deposited are non-refundable. 2. Monthly fee is payable by 10th of every month.'}</p>
              </div>

              <div className="text-center shrink-0">
                <div className="w-36 border-b border-neutral-400 mb-1 pb-4">
                  <span className="font-serif italic text-neutral-600 text-[11px]">Vikas Singla</span>
                </div>
                <span className="text-[11px] font-bold text-neutral-700 block">Authorized Signatory</span>
                <span className="text-[10px] text-neutral-500 block">Vanita Math Classes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
