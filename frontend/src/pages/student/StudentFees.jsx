import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, Badge, EmptyState } from '@/components/ui'
import { studentService, paymentService } from '@/services'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useRazorpay } from '@/hooks/useRazorpay'
import { DollarSign, CheckCircle, AlertCircle, CreditCard, X, Loader2, Info } from 'lucide-react'
import toast from 'react-hot-toast'

const QUICK_AMOUNTS = [500, 1000, 2000, 3000, 5000]

function PayNowModal({ student, fees, onClose }) {
  const qc = useQueryClient()
  const { openCheckout } = useRazorpay()
  const [amount, setAmount] = useState('')
  const [month, setMonth] = useState('')
  const [paying, setPaying] = useState(false)

  const pending = Math.max(0, (student.totalFee || 0) - (student.paidFee || 0))
  const minAmount = 100
  const amtNum = Number(amount)

  const pendingFees = fees.filter((f) => f.paymentStatus !== 'paid')
  const firstPendingFee = pendingFees[0]

  const validate = () => {
    if (!amtNum || amtNum < minAmount) return `Minimum payment is ${formatCurrency(minAmount)}`
    if (amtNum > pending) return `Cannot exceed pending balance of ${formatCurrency(pending)}`
    return null
  }

  const handlePay = async () => {
    const err = validate()
    if (err) {
      toast.error(err)
      return
    }
    setPaying(true)
    try {
      const orderData = await paymentService.createOnlineOrder({
        amount: amtNum,
        feeId: firstPendingFee?._id || null,
      })
      const response = await openCheckout({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Vanita Math Classes',
        description: `Fee Payment — ${month || 'Tuition Fee'}`,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.studentName,
          email: orderData.studentEmail,
          contact: orderData.studentPhone,
        },
        theme: { color: '#E50914' },
      })
      await paymentService.verifyOnlinePayment({
        orderId: response.razorpay_order_id,
        paymentId: response.razorpay_payment_id,
        signature: response.razorpay_signature,
        amount: amtNum,
        feeId: firstPendingFee?._id || null,
        month: month || null,
      })
      toast.success(`Payment of ${formatCurrency(amtNum)} successful! Receipt generated.`)
      qc.invalidateQueries(['my-fees'])
      qc.invalidateQueries(['my-payments'])
      qc.invalidateQueries(['my-profile'])
      onClose()
    } catch (e) {
      if (e.message === 'Payment cancelled') {
        toast('Payment cancelled.')
      } else {
        toast.error(e.message || 'Payment failed. Please try again.')
      }
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Pay Tuition Fees</h2>
              <p className="text-xs text-gray-500">Vanita Math Classes, Bathinda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={paying}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Summary Box */}
          <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-3 text-center border border-gray-200/60">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Fee</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{formatCurrency(student.totalFee)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Paid</p>
              <p className="text-sm font-bold text-emerald-600 mt-0.5">{formatCurrency(student.paidFee)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Pending Dues</p>
              <p className="text-sm font-bold text-primary-600 mt-0.5">{formatCurrency(pending)}</p>
            </div>
          </div>

          {pending === 0 ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-4 text-emerald-800">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <p className="text-sm font-medium">All fees are cleared. No outstanding dues.</p>
            </div>
          ) : (
            <>
              {/* Quick Select Buttons */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Quick Select Amount</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.filter((a) => a <= pending).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAmount(String(a))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        amtNum === a
                          ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-primary-400'
                      }`}
                    >
                      {formatCurrency(a)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAmount(String(pending))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      amtNum === pending
                        ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                        : 'bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100'
                    }`}
                  >
                    Full Balance ({formatCurrency(pending)})
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  Amount to Pay (₹) <span className="text-primary-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder={`Min ₹${minAmount} — Max ${formatCurrency(pending)}`}
                    min={minAmount}
                    max={pending}
                  />
                </div>
              </div>

              {/* Month / Remark */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  Billing Period / Month (optional)
                </label>
                <input
                  type="text"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g. October 2026"
                />
              </div>

              {/* Security info */}
              <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
                <Info className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                <span>
                  Payments are processed securely. A persistent VMC PDF receipt will be automatically generated.
                </span>
              </div>

              <button
                type="button"
                onClick={handlePay}
                disabled={paying || !amtNum || amtNum < minAmount || amtNum > pending}
                className="btn btn-primary w-full justify-center gap-2 py-3 text-sm font-bold disabled:opacity-50"
              >
                {paying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Secure Payment…
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pay {amtNum >= minAmount && amtNum <= pending ? formatCurrency(amtNum) : 'Now'}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function StudentFees() {
  const [payModal, setPayModal] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-fees'],
    queryFn: studentService.getMyFees,
  })

  if (isLoading) {
    return (
      <Sidebar>
        <PageLoader />
      </Sidebar>
    )
  }

  const student = data?.student || {}
  const fees = data?.fees || []
  const paid = fees.filter((f) => f.paymentStatus === 'paid').length
  const pending = fees.filter((f) => ['pending', 'overdue'].includes(f.paymentStatus)).length
  const pendingAmount = Math.max(0, (student.totalFee || 0) - (student.paidFee || 0))
  const progressPct = Math.min(100, ((student.paidFee || 0) / (student.totalFee || 1)) * 100)

  return (
    <Sidebar>
      {payModal && (
        <PayNowModal
          student={student}
          fees={fees}
          onClose={() => {
            setPayModal(false)
            refetch()
          }}
        />
      )}

      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Tuition Fee Ledger</h1>
          <p className="page-subtitle">Detailed breakdown of monthly fees, dues, and payment records</p>
        </div>
        {pendingAmount > 0 && (
          <button
            onClick={() => setPayModal(true)}
            className="btn btn-primary gap-2 shrink-0 self-start sm:self-auto"
          >
            <CreditCard className="w-4 h-4" /> Pay Online
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total Agreed Fee</p>
          <p className="text-xl font-extrabold text-gray-900 mt-1">{formatCurrency(student.totalFee)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Academic session</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total Paid</p>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">{formatCurrency(student.paidFee)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{paid} installments</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Balance Due</p>
          <p className="text-xl font-extrabold text-primary-600 mt-1">{formatCurrency(pendingAmount)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{pending} pending</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Fee Status</p>
          <p className="text-xl font-extrabold text-gray-900 mt-1 capitalize">{student.feeStatus || '—'}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Enrolled Class {student.class}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-700 font-semibold">Fee Clearance Progress</span>
          <span className="font-extrabold text-primary-700">{Math.round(progressPct)}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{paid} cleared</span>
          <span>{pending} pending</span>
        </div>
      </div>

      {/* Dues Alert Banner */}
      {pendingAmount > 0 && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                You have pending dues of {formatCurrency(pendingAmount)}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Kindly clear dues at the institute desk or click Pay Online.
              </p>
            </div>
          </div>
          <button onClick={() => setPayModal(true)} className="btn btn-primary btn-sm shrink-0">
            Pay Now
          </button>
        </div>
      )}

      {/* Fee Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {fees.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="No fee records found"
            description="Fee records generated by admin will be listed here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Period / Fee Type</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Balance</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fees.map((f) => {
                  const remaining = Math.max(0, f.amount - (f.paidAmount || 0))
                  return (
                    <tr key={f._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-gray-900">{f.month || 'Tuition Fee'}</p>
                        <p className="text-xs text-gray-500 capitalize">{f.feeType}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {formatCurrency(f.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold ${
                            f.paidAmount > 0 ? 'text-emerald-600' : 'text-gray-400'
                          }`}
                        >
                          {formatCurrency(f.paidAmount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold ${
                            remaining > 0 ? 'text-primary-600' : 'text-emerald-600'
                          }`}
                        >
                          {remaining > 0 ? (
                            formatCurrency(remaining)
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-xs">
                              <CheckCircle className="w-3.5 h-3.5" /> Paid
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {formatDate(f.dueDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            f.paymentStatus === 'paid'
                              ? 'success'
                              : f.paymentStatus === 'partial'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {f.paymentStatus}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Sidebar>
  )
}
