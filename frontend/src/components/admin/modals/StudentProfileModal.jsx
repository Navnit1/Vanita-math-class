import {
  X,
  Edit2,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  CreditCard,
  MessageSquare,
  CheckCircle2,
  Receipt,
  Eye,
  School
} from 'lucide-react'
import { formatCurrency, formatDate, buildWhatsAppFeeReminder } from '@/utils/formatters'

export default function StudentProfileModal({
  isOpen,
  onClose,
  student,
  batches = [],
  payments = [],
  settings = {},
  currentMonth = 'September 2026',
  onEditStudent,
  onRecordPayment,
  onViewReceipt,
}) {
  if (!isOpen || !student) return null

  const studentName = student.fullName || student.name || 'Student'
  const rollNo = student.studentId || student.rollNo || 'VMC-101'
  const grade = student.class || student.grade || '10th Class'
  const guardianName = student.parentName || student.guardianName || 'Parent'
  const guardianPhone = student.parentPhone || student.guardianPhone || ''
  const studentPhone = student.phone || ''
  const email = student.email || ''
  const school = student.school || student.schoolOrCollege || ''
  const status = student.status || 'active'
  const avatarColor = student.avatarColor || '#4f46e5'
  const discountPercent = Number(student.discountPercent || 0)

  // Enrolled batches
  const enrolledBatches = batches.filter((b) =>
    (student.batchIds || []).includes(b.id || b.batchId) ||
    b.name === student.batch ||
    b.grade === grade
  )

  // Fees calculation
  const monthlyFee = Number(student.monthlyFee || (enrolledBatches[0]?.monthlyFee || 2500))

  // Student's payments
  const studentPayments = payments.filter((p) => {
    const pStudentId = p.studentId?._id || p.studentId || ''
    const curId = student._id || student.id || ''
    return String(pStudentId) === String(curId)
  })

  const totalPaid = studentPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)

  // Current month payment
  const currentMonthPaid = studentPayments
    .filter((p) => (p.month || '').toLowerCase() === currentMonth.toLowerCase())
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)

  const currentMonthDue = Math.max(0, monthlyFee - currentMonthPaid)

  const whatsAppReminderUrl = buildWhatsAppFeeReminder(student, settings, currentMonthDue, [currentMonth])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-neutral-200">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 flex items-start justify-between bg-neutral-50/50">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-sm shrink-0"
              style={{ backgroundColor: avatarColor }}
            >
              {studentName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-neutral-900">{studentName}</h2>
                <span className="font-mono text-xs px-2 py-0.5 bg-neutral-200 text-neutral-800 rounded font-semibold">
                  {rollNo}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                {grade} {school ? `· ${school}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose()
                if (onEditStudent) onEditStudent(student)
              }}
              className="p-1.5 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-200/60 cursor-pointer"
              title="Edit Profile"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto p-6 space-y-6 text-xs sm:text-sm">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
              <span className="text-xs text-neutral-500 block">Monthly Tuition Fee</span>
              <div className="text-lg font-bold font-mono text-neutral-900 mt-0.5 tabular-nums">
                {formatCurrency(monthlyFee, settings.currencySymbol)}
                {discountPercent > 0 && (
                  <span className="text-xs font-normal text-emerald-600 ml-1">
                    ({discountPercent}% off)
                  </span>
                )}
              </div>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
              <span className="text-xs text-neutral-500 block">Fee for {currentMonth.split(' ')[0]}</span>
              <div className="text-lg font-bold font-mono mt-0.5 tabular-nums">
                {currentMonthDue === 0 ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Cleared
                  </span>
                ) : (
                  <span className="text-amber-700">
                    Due: {formatCurrency(currentMonthDue, settings.currencySymbol)}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
              <span className="text-xs text-neutral-500 block">Total Lifetime Paid</span>
              <div className="text-lg font-bold font-mono text-neutral-900 mt-0.5 tabular-nums">
                {formatCurrency(totalPaid, settings.currencySymbol)}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => {
                onClose()
                if (onRecordPayment) onRecordPayment(student._id || student.id)
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Collect Fee</span>
            </button>

            {guardianPhone && (
              <a
                href={whatsAppReminderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                <span>WhatsApp Parent Reminder</span>
              </a>
            )}
          </div>

          {/* Details Sections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Contact Details */}
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Contact Information
              </h3>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-neutral-800">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Student Phone: <strong>{studentPhone || '-'}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-neutral-800">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Parent Phone: <strong>{guardianPhone || '-'}</strong> ({guardianName})</span>
                </div>
                {email && (
                  <div className="flex items-center gap-2 text-neutral-800">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Email: {email}</span>
                  </div>
                )}
                {school && (
                  <div className="flex items-center gap-2 text-neutral-800">
                    <School className="w-3.5 h-3.5 text-neutral-400" />
                    <span>School: {school}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Academic & Batch */}
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Batch & Academic Profile
              </h3>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-neutral-800">
                  <GraduationCap className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Enrolled Grade: <strong>{grade}</strong></span>
                </div>
                {enrolledBatches.map((b) => (
                  <div key={b.id || b.batchId} className="text-neutral-700 text-xs pl-5">
                    • <strong>{b.name}</strong> ({b.schedule})
                  </div>
                ))}
                {student.notes && (
                  <div className="pt-2 text-neutral-600 text-[11px] italic">
                    "{student.notes}"
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment History Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Payment History ({studentPayments.length})
            </h3>
            {studentPayments.length === 0 ? (
              <p className="text-xs text-neutral-400 p-4 text-center bg-neutral-50 rounded-lg border border-neutral-200">
                No payment transactions recorded yet for this student.
              </p>
            ) : (
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 text-neutral-700 font-semibold border-b border-neutral-200">
                      <th className="py-2 px-3">Receipt #</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Month</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                      <th className="py-2 px-3">Mode</th>
                      <th className="py-2 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentPayments.map((p) => (
                      <tr key={p._id || p.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="py-2 px-3 font-mono font-medium text-neutral-900">
                          {p.receiptNumber || p.receiptNo}
                        </td>
                        <td className="py-2 px-3 text-neutral-600">{formatDate(p.paymentDate)}</td>
                        <td className="py-2 px-3 text-neutral-800">{p.month}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-neutral-900">
                          {formatCurrency(p.amount, settings.currencySymbol)}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 font-medium text-neutral-700">
                            {p.paymentMethod || p.paymentMode}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (onViewReceipt) onViewReceipt(p, student)
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
