import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, Badge, EmptyState } from '@/components/ui'
import { studentService, paymentService } from '@/services'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useRazorpay } from '@/hooks/useRazorpay'
import { DollarSign, CheckCircle, AlertCircle, CreditCard, X, Loader2, Info } from 'lucide-react'
import toast from 'react-hot-toast'

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000]

function PayNowModal({ student, fees, onClose }) {
  const qc = useQueryClient()
  const { openCheckout } = useRazorpay()
  const [amount, setAmount] = useState('')
  const [month, setMonth] = useState('')
  const [paying, setPaying] = useState(false)

  const pending = Math.max(0, (student.totalFee || 0) - (student.paidFee || 0))
  const minAmount = 100
  const amtNum = Number(amount)

  const pendingFees = fees.filter(f => f.paymentStatus !== 'paid')
  const firstPendingFee = pendingFees[0]

  const validate = () => {
    if (!amtNum || amtNum < minAmount) return `Minimum payment is ${formatCurrency(minAmount)}`
    if (amtNum > pending) return `Cannot exceed pending fee of ${formatCurrency(pending)}`
    return null
  }

  const handlePay = async () => {
    const err = validate()
    if (err) { toast.error(err); return }
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
        description: `Fee Payment — ${month || 'General'}`,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.studentName,
          email: orderData.studentEmail,
          contact: orderData.studentPhone,
        },
        theme: { color: '#2563eb' },
      })
      await paymentService.verifyOnlinePayment({
        orderId: response.razorpay_order_id,
        paymentId: response.razorpay_payment_id,
        signature: response.razorpay_signature,
        amount: amtNum,
        feeId: firstPendingFee?._id || null,
        month: month || null,
      })
      toast.success(`Payment of ${formatCurrency(amtNum)} successful!`)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Pay Now</h2>
          </div>
          <button onClick={onClose} disabled={paying} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Fee summary */}
          <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Fee</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">{formatCurrency(student.totalFee)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Paid</p>
              <p className="text-base font-bold text-green-600 mt-0.5">{formatCurrency(student.paidFee)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Pending</p>
              <p className="text-base font-bold text-orange-500 mt-0.5">{formatCurrency(pending)}</p>
            </div>
          </div>

          {pending === 0 ? (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-4 text-green-700">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">All fees are paid. No pending amount.</p>
            </div>
          ) : (
            <>
              {/* Quick amount buttons */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Quick Select</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.filter(a => a <= pending).map(a => (
                    <button
                      key={a}
                      onClick={() => setAmount(String(a))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        amtNum === a
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-primary-400'
                      }`}
                    >
                      {formatCurrency(a)}
                    </button>
                  ))}
                  <button
                    onClick={() => setAmount(String(pending))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      amtNum === pending
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-orange-600 border-orange-200 hover:border-orange-400'
                    }`}
                  >
                    Full ({formatCurrency(pending)})
                  </button>
                </div>
              </div>

              {/* Custom amount */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  Enter Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="input pl-7"
                    placeholder={`Min ₹${minAmount} — Max ${formatCurrency(pending)}`}
                    min={minAmount}
                    max={pending}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Enter any amount between {formatCurrency(minAmount)} and {formatCurrency(pending)}
                </p>
              </div>

              {/* Month */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Month / Period (optional)</label>
                <input
                  type="text"
                  value={month}
                  onChange={e => setMonth(e.target.value)}
                  className="input"
                  placeholder="e.g. June 2025"
                />
              </div>

              {/* Info */}
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-3 text-xs text-blue-700">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>Payments are processed securely via Razorpay. A receipt will be generated after payment.</span>
              </div>

              <button
                onClick={handlePay}
                disabled={paying || !amtNum || amtNum < minAmount || amtNum > pending}
                className="btn btn-primary w-full justify-center gap-2 py-3"
              >
                {paying ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Processing…</>
                ) : (
                  <><CreditCard className="w-4 h-4" />Pay {amtNum >= minAmount && amtNum <= pending ? formatCurrency(amtNum) : 'Now'}</>
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

  if (isLoading) return <Sidebar><PageLoader /></Sidebar>

  const student = data?.student || {}
  const fees = data?.fees || []
  const paid = fees.filter(f => f.paymentStatus === 'paid').length
  const pending = fees.filter(f => ['pending', 'overdue'].includes(f.paymentStatus)).length
  const pendingAmount = Math.max(0, (student.totalFee || 0) - (student.paidFee || 0))
  const progressPct = Math.min(100, ((student.paidFee || 0) / (student.totalFee || 1)) * 100)

  return (
    <Sidebar>
      {payModal && (
        <PayNowModal
          student={student}
          fees={fees}
          onClose={() => { setPayModal(false); refetch() }}
        />
      )}

      <div className="page-header flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">My Fees</h1>
          <p className="page-subtitle">View your fee schedule and payment status</p>
        </div>
        {pendingAmount > 0 && (
          <button
            onClick={() => setPayModal(true)}
            className="btn btn-primary gap-2 flex-shrink-0"
          >
            <CreditCard className="w-4 h-4" />
            Pay Now
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-xs text-slate-500 font-medium">Total Fee</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(student.totalFee)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500 font-medium">Paid</p>
          <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(student.paidFee)}</p>
          <p className="text-xs text-slate-500 mt-0.5">{paid} instalment(s)</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500 font-medium">Pending</p>
          <p className="text-xl font-bold text-orange-500 mt-1">{formatCurrency(pendingAmount)}</p>
          <p className="text-xs text-slate-500 mt-0.5">{pending} due</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500 font-medium">Status</p>
          <p className="text-xl font-bold text-slate-900 mt-1 capitalize">{student.feeStatus || '—'}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="card p-5 mb-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-600 font-medium">Fee Payment Progress</span>
          <span className="font-semibold text-slate-900">{Math.round(progressPct)}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>{paid} paid</span>
          <span>{pending} pending</span>
        </div>
      </div>

      {/* Pay Now banner when there is pending */}
      {pendingAmount > 0 && (
        <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl px-5 py-4 mb-5">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-800">You have a pending fee of {formatCurrency(pendingAmount)}</p>
              <p className="text-xs text-orange-600 mt-0.5">Pay in full or as an instalment using Razorpay</p>
            </div>
          </div>
          <button onClick={() => setPayModal(true)} className="btn btn-primary btn-sm flex-shrink-0">
            Pay Now
          </button>
        </div>
      )}

      {/* Fee table */}
      <div className="table-container">
        {fees.length === 0 ? (
          <EmptyState icon={DollarSign} title="No fee records" description="Your fee records will appear here once created by admin." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Month / Type</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Remaining</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {fees.map(f => {
                const remaining = Math.max(0, f.amount - (f.paidAmount || 0))
                return (
                  <tr key={f._id}>
                    <td>
                      <p className="font-medium text-sm text-slate-900">{f.month || '—'}</p>
                      <p className="text-xs text-slate-500 capitalize">{f.feeType}</p>
                    </td>
                    <td><span className="font-medium">{formatCurrency(f.amount)}</span></td>
                    <td>
                      <span className={`font-medium text-sm ${f.paidAmount > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                        {formatCurrency(f.paidAmount)}
                      </span>
                    </td>
                    <td>
                      <span className={`font-medium text-sm ${remaining > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                        {remaining > 0 ? formatCurrency(remaining) : <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />Paid</span>}
                      </span>
                    </td>
                    <td>
                      <span className={`text-sm ${new Date(f.dueDate) < new Date() && f.paymentStatus !== 'paid' ? 'text-red-500 font-medium' : 'text-slate-600'}`}>
                        {formatDate(f.dueDate)}
                      </span>
                    </td>
                    <td>
                      <Badge variant={f.paymentStatus === 'paid' ? 'green' : f.paymentStatus === 'partial' ? 'yellow' : f.paymentStatus === 'overdue' ? 'red' : 'slate'}>
                        {f.paymentStatus}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </Sidebar>
  )
}
