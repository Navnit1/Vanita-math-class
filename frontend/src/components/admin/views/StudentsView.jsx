import { useState, useMemo } from 'react'
import {
  Search,
  Plus,
  Download,
  CreditCard,
  Edit2,
  Trash2,
  Eye,
  MessageSquare,
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { formatCurrency, exportToCsv, buildWhatsAppFeeReminder } from '@/utils/formatters'

export default function StudentsView({
  students = [],
  batches = [],
  payments = [],
  settings = {},
  currentMonth = 'September 2026',
  onOpenAddStudent,
  onEditStudent,
  onDeleteStudent,
  onViewStudent,
  onRecordPayment,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [batchFilter, setBatchFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [feeStatusFilter, setFeeStatusFilter] = useState('all')

  // Enriched students with calculated monthly fee and current month fee status
  const enrichedStudents = useMemo(() => {
    return students.map((s) => {
      let monthlyFee = Number(s.monthlyFee || 0)
      if (!monthlyFee && batches.length > 0) {
        const b = batches.find((item) =>
          (s.batchIds || []).includes(item.id || item.batchId) ||
          item.name === s.batch ||
          item.grade === (s.grade || s.class)
        )
        monthlyFee = b ? b.monthlyFee : 2500
      }

      const currentMonthPaid = payments
        .filter((p) => {
          const pStudentId = p.studentId?._id || p.studentId || ''
          const curId = s._id || s.id || ''
          return String(pStudentId) === String(curId) && (p.month || '').toLowerCase() === currentMonth.toLowerCase()
        })
        .reduce((sum, p) => sum + Number(p.amount || 0), 0)

      const balanceDue = Math.max(0, monthlyFee - currentMonthPaid)
      let feeStatus = 'paid'
      if (monthlyFee > 0) {
        if (currentMonthPaid === 0) feeStatus = 'due'
        else if (currentMonthPaid < monthlyFee) feeStatus = 'partial'
      }

      return {
        ...s,
        monthlyFee,
        paidThisMonth: currentMonthPaid,
        balanceDue,
        feeStatus,
      }
    })
  }, [students, batches, payments, currentMonth])

  // Filtered list
  const filteredStudents = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    return enrichedStudents.filter((s) => {
      const name = (s.fullName || s.name || '').toLowerCase()
      const rollNo = (s.studentId || s.rollNo || '').toLowerCase()
      const phone = (s.phone || '')
      const guardian = (s.parentName || s.guardianName || '').toLowerCase()
      const school = (s.school || s.schoolOrCollege || '').toLowerCase()

      const matchesSearch = !q ||
        name.includes(q) ||
        rollNo.includes(q) ||
        phone.includes(q) ||
        guardian.includes(q) ||
        school.includes(q)

      const matchesBatch = batchFilter === 'all' ||
        (s.batchIds || []).includes(batchFilter) ||
        s.batch === batchFilter

      const matchesStatus = statusFilter === 'all' || s.status === statusFilter

      const matchesFee = feeStatusFilter === 'all' ||
        (feeStatusFilter === 'due' && s.balanceDue > 0) ||
        (feeStatusFilter === 'paid' && s.balanceDue === 0)

      return matchesSearch && matchesBatch && matchesStatus && matchesFee
    })
  }, [enrichedStudents, searchTerm, batchFilter, statusFilter, feeStatusFilter])

  const handleExportCsv = () => {
    const headers = [
      'Roll No', 'Student Name', 'Phone', 'Email', 'Guardian Name', 'Guardian Phone',
      'Grade', 'School/College', 'Batches', 'Monthly Fee', 'Status', 'Balance Due Current Month'
    ]
    const rows = filteredStudents.map((s) => {
      const enrolledBatches = (s.batchIds || [])
        .map((bId) => batches.find((b) => (b.id || b.batchId) === bId)?.name || bId)
        .join('; ') || s.batch || ''

      return [
        s.studentId || s.rollNo,
        s.fullName || s.name,
        s.phone,
        s.email || '',
        s.parentName || s.guardianName,
        s.parentPhone || s.guardianPhone,
        s.class || s.grade,
        s.school || s.schoolOrCollege || '',
        enrolledBatches,
        s.monthlyFee,
        s.status,
        s.balanceDue
      ]
    })

    exportToCsv(`vmc_students_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
  }

  return (
    <div className="space-y-5">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
            <span>Student Directory</span>
            <span>·</span>
            <span className="font-mono">{students.length} Total Enrolled</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
            Students Management
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5 text-neutral-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddStudent}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-3 sm:p-4 space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, roll no, phone, parent name, school..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-neutral-50/50"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="w-full md:w-56">
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            >
              <option value="all">All Batches ({batches.length})</option>
              {batches.map((b) => (
                <option key={b.id || b.batchId} value={b.id || b.batchId}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-40">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive / On Leave</option>
            </select>
          </div>

          <div className="w-full md:w-44">
            <select
              value={feeStatusFilter}
              onChange={(e) => setFeeStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            >
              <option value="all">Fee Status ({currentMonth.split(' ')[0]})</option>
              <option value="due">Fee Pending / Due</option>
              <option value="paid">Fee Cleared</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-neutral-500 flex items-center justify-between pt-2 border-t border-neutral-100">
          <span>Showing {filteredStudents.length} of {students.length} students</span>
          {(searchTerm || batchFilter !== 'all' || statusFilter !== 'all' || feeStatusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                setBatchFilter('all')
                setStatusFilter('all')
                setFeeStatusFilter('all')
              }}
              className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/75 text-xs font-semibold text-neutral-600">
                <th className="py-3 px-4">Roll No & Student</th>
                <th className="py-3 px-4">Class & Contact</th>
                <th className="py-3 px-4">Enrolled Batches</th>
                <th className="py-3 px-4 text-right">Monthly Fee</th>
                <th className="py-3 px-4">{currentMonth.split(' ')[0]} Status</th>
                <th className="py-3 px-4 text-center">Enrollment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs sm:text-sm">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    <p className="text-sm font-medium">No students match your filter criteria.</p>
                    <p className="text-xs text-neutral-400 mt-1">Try modifying your search or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const sId = s._id || s.id
                  const sName = s.fullName || s.name
                  const sRoll = s.studentId || s.rollNo
                  const sGrade = s.class || s.grade
                  const sParent = s.parentName || s.guardianName
                  const sPhone = s.phone
                  const sParentPhone = s.parentPhone || s.guardianPhone

                  const enrolledBatchObjs = batches.filter((b) =>
                    (s.batchIds || []).includes(b.id || b.batchId) ||
                    b.name === s.batch ||
                    b.grade === sGrade
                  )

                  const reminderUrl = buildWhatsAppFeeReminder(s, settings, s.balanceDue, [currentMonth])

                  return (
                    <tr key={sId} className="hover:bg-neutral-50/80 transition-colors">
                      {/* Roll & Student */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-2xs"
                            style={{ backgroundColor: s.avatarColor || '#4f46e5' }}
                          >
                            {sName.charAt(0)}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => onViewStudent && onViewStudent(s)}
                              className="font-bold text-neutral-900 hover:text-indigo-600 text-left cursor-pointer"
                            >
                              {sName}
                            </button>
                            <span className="block font-mono text-[11px] text-neutral-500 font-semibold">
                              {sRoll}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Class & Contact */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-neutral-900 block">{sGrade}</span>
                        <span className="text-[11px] text-neutral-500 block">
                          Ph: {sPhone || '-'}
                        </span>
                        {sParent && (
                          <span className="text-[11px] text-neutral-400 block truncate max-w-[140px]">
                            P: {sParent}
                          </span>
                        )}
                      </td>

                      {/* Enrolled Batches */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {enrolledBatchObjs.length > 0 ? (
                            enrolledBatchObjs.map((b) => (
                              <span
                                key={b.id || b.batchId}
                                className="text-[10px] px-2 py-0.5 rounded font-medium bg-neutral-100 text-neutral-700 truncate"
                              >
                                {b.name.split(' - ')[0] || b.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-neutral-400 text-xs">-</span>
                          )}
                        </div>
                      </td>

                      {/* Monthly Fee */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-bold text-neutral-900 block">
                          {formatCurrency(s.monthlyFee, settings.currencySymbol)}
                        </span>
                        {Number(s.discountPercent || 0) > 0 && (
                          <span className="text-[10px] text-emerald-600 font-medium block">
                            {s.discountPercent}% waiver
                          </span>
                        )}
                      </td>

                      {/* Current Month Status */}
                      <td className="py-3 px-4">
                        {s.balanceDue === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Paid</span>
                          </span>
                        ) : s.paidThisMonth > 0 ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              <span>Partial</span>
                            </span>
                            <span className="block font-mono text-[10px] text-amber-700 mt-0.5">
                              Due: {formatCurrency(s.balanceDue, settings.currencySymbol)}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                              <AlertCircle className="w-3 h-3" />
                              <span>Due</span>
                            </span>
                            <span className="block font-mono text-[10px] text-rose-700 mt-0.5">
                              {formatCurrency(s.balanceDue, settings.currencySymbol)}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Enrollment status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            s.status === 'active'
                              ? 'bg-neutral-100 text-neutral-800'
                              : 'bg-neutral-100 text-neutral-400'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {s.balanceDue > 0 && sParentPhone && (
                            <a
                              href={reminderUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Send WhatsApp Fee Reminder"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => onRecordPayment && onRecordPayment(sId)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Collect Fee & Issue Receipt"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onViewStudent && onViewStudent(s)}
                            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                            title="View Full Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onEditStudent && onEditStudent(s)}
                            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Student"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete ${sName} (${sRoll})?`)) {
                                onDeleteStudent(sId)
                              }
                            }}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Student"
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
