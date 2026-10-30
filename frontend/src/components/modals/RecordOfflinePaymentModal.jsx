import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal, FormField, Select } from '@/components/ui'
import { studentService, paymentService } from '@/services'
import { formatCurrency } from '@/lib/utils'
import { CreditCard, Loader2, CheckCircle2, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RecordOfflinePaymentModal({ isOpen, onClose, preselectedStudent = null }) {
  const [selectedStudentId, setSelectedStudentId] = useState(preselectedStudent?._id || '')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [month, setMonth] = useState(new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' }))
  const [notes, setNotes] = useState('')
  const [transactionId, setTransactionId] = useState('')

  const qc = useQueryClient()

  // Fetch active students for selector dropdown if no student preselected
  const { data: studentsData } = useQuery({
    queryKey: ['students-quick-list'],
    queryFn: () => studentService.getAll({ limit: 200, status: 'active' }),
    enabled: isOpen && !preselectedStudent,
  })
  const students = studentsData?.students || []

  // Active student object
  const activeStudent = preselectedStudent || students.find(s => s._id === selectedStudentId)

  useEffect(() => {
    if (preselectedStudent) {
      setSelectedStudentId(preselectedStudent._id)
      const due = Math.max(0, (preselectedStudent.totalFee || 0) - (preselectedStudent.paidFee || 0))
      setAmount(due > 0 ? String(due) : String(preselectedStudent.monthlyFee || 2500))
    } else if (activeStudent) {
      const due = Math.max(0, (activeStudent.totalFee || 0) - (activeStudent.paidFee || 0))
      setAmount(due > 0 ? String(due) : String(activeStudent.monthlyFee || 2500))
    }
  }, [preselectedStudent, selectedStudentId])

  const recordMutation = useMutation({
    mutationFn: paymentService.create,
    onSuccess: (res) => {
      qc.invalidateQueries(['students'])
      qc.invalidateQueries(['admin-dashboard'])
      qc.invalidateQueries(['payments'])
      qc.invalidateQueries(['fees'])
      toast.success(`Fee recorded! Receipt #${res.receiptNumber || 'Generated'}`)
      onClose()
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to record fee payment')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedStudentId) {
      toast.error('Please select a student')
      return
    }
    const numAmount = Number(amount)
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid payment amount')
      return
    }

    recordMutation.mutate({
      studentId: selectedStudentId,
      amount: numAmount,
      paymentMethod,
      month,
      notes,
      transactionId: paymentMethod !== 'cash' ? transactionId : undefined,
    })
  }

  const pendingDues = activeStudent ? Math.max(0, (activeStudent.totalFee || 0) - (activeStudent.paidFee || 0)) : 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Tuition Fee Payment" size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Student Selection (if not preselected) */}
        {!preselectedStudent && (
          <FormField label="Select Student" required>
            <Select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="text-xs"
            >
              <option value="">-- Choose Student (Roll / Name / Class) --</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.studentId} - {s.fullName} (Class {s.class} · {s.batch})
                </option>
              ))}
            </Select>
          </FormField>
        )}

        {/* Selected Student Summary Card */}
        {activeStudent && (
          <div className="p-3.5 bg-[#FFF5F5] border border-[#FFCCD0] rounded-xl text-xs space-y-1">
            <div className="flex justify-between items-start">
              <span className="font-extrabold text-[#171717] text-sm">{activeStudent.fullName}</span>
              <span className="font-mono font-bold text-[#E50914]">{activeStudent.studentId}</span>
            </div>
            <p className="text-[#64748B]">
              Class {activeStudent.class} ({activeStudent.batch} Batch) · Parent: {activeStudent.parentName || '—'}
            </p>
            <div className="pt-1 flex justify-between items-center font-bold">
              <span className="text-[#64748B]">Current Outstanding Dues:</span>
              <span className={pendingDues > 0 ? 'text-[#C90019]' : 'text-[#059669]'}>
                {formatCurrency(pendingDues)}
              </span>
            </div>
          </div>
        )}

        {/* Amount & Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Payment Amount (₹)" required>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 2500"
              className="input font-bold text-base text-[#171717]"
              required
            />
          </FormField>

          <FormField label="Payment Method" required>
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="cash">Cash Payment</option>
              <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
              <option value="bank_transfer">Bank Transfer / NEFT</option>
              <option value="cheque">Cheque</option>
            </Select>
          </FormField>
        </div>

        {/* Month & Optional Transaction ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Billing Month" required>
            <input
              type="text"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="input text-xs"
              placeholder="e.g. November 2026"
            />
          </FormField>

          {paymentMethod !== 'cash' && (
            <FormField label="UPI / UTR / Reference No.">
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. UPI Ref #482910"
                className="input text-xs font-mono"
              />
            </FormField>
          )}
        </div>

        <FormField label="Remarks / Notes (Optional)">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Paid in full for current month"
            className="input text-xs"
          />
        </FormField>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t border-[#D9DDE3]">
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={recordMutation.isPending || !selectedStudentId}
            className="btn btn-primary btn-sm font-bold shadow-red-glow flex items-center gap-1.5"
          >
            {recordMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Recording…
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" /> Record Payment & Issue Receipt
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
