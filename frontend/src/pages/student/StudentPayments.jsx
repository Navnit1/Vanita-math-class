import { useQuery } from '@tanstack/react-query'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, Badge, EmptyState } from '@/components/ui'
import { paymentService } from '@/services'
import { formatCurrency, formatDate, paymentMethodLabel } from '@/lib/utils'
import {
  ClipboardList,
  Download,
  CreditCard,
  FileText,
  Share2,
} from 'lucide-react'
import toast from 'react-hot-toast'

function downloadCSV(payments) {
  const rows = [
    ['Receipt No', 'Amount', 'Method', 'Type', 'Date', 'Month', 'Transaction ID', 'Status'],
    ...payments.map((p) => [
      p.receiptNumber,
      p.amount,
      paymentMethodLabel(p.paymentMethod),
      p.paymentType || 'offline',
      new Date(p.paymentDate).toLocaleDateString('en-IN'),
      p.month || '',
      p.transactionId || p.gatewayPaymentId || '',
      p.status,
    ]),
  ]
  const csv = rows.map((r) => r.join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `vmc-payments-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
}

export default function StudentPayments() {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['my-payments'],
    queryFn: paymentService.getMyPayments,
  })

  if (isLoading) {
    return (
      <Sidebar>
        <PageLoader />
      </Sidebar>
    )
  }

  const total = payments.reduce((s, p) => s + p.amount, 0)
  const onlineTotal = payments.filter((p) => p.paymentType === 'online').reduce((s, p) => s + p.amount, 0)
  const offlineTotal = payments.filter((p) => p.paymentType !== 'online').reduce((s, p) => s + p.amount, 0)

  const handleDownloadReceipt = async (p) => {
    try {
      toast.loading('Preparing receipt PDF...', { id: 'receipt-dl' })
      await paymentService.downloadReceipt(p._id, p.receiptNumber)
      toast.success('Receipt downloaded successfully!', { id: 'receipt-dl' })
    } catch (err) {
      toast.error('Could not download receipt PDF.', { id: 'receipt-dl' })
    }
  }

  return (
    <Sidebar>
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Receipts & Payment History</h1>
          <p className="page-subtitle">
            {payments.length} payment records · Total {formatCurrency(total)} paid to VMC
          </p>
        </div>
        {payments.length > 0 && (
          <button
            onClick={() => downloadCSV(payments)}
            className="btn btn-outline btn-sm border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" /> Export History (CSV)
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {payments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Total Amount Cleared</p>
            <p className="text-xl font-extrabold text-emerald-600 mt-1">{formatCurrency(total)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Lifetime paid</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Online (Razorpay / UPI)</p>
            <p className="text-xl font-extrabold text-gray-900 mt-1">{formatCurrency(onlineTotal)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Direct gateway receipts</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Offline (Cash / Direct)</p>
            <p className="text-xl font-extrabold text-gray-900 mt-1">{formatCurrency(offlineTotal)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Recorded at VMC desk</p>
          </div>
        </div>
      )}

      {/* Receipts Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {payments.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No payment receipts found"
            description="Whenever fees are paid online or offline at the institute, your verified receipt will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Receipt No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary-600 shrink-0" />
                        <div>
                          <span className="font-mono font-bold text-gray-900 text-xs">
                            {p.receiptNumber}
                          </span>
                          {p.transactionId && (
                            <p className="font-mono text-[10px] text-gray-400 truncate max-w-[120px]">
                              {p.transactionId}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      {formatDate(p.paymentDate)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-gray-800">
                      {p.month || 'Tuition Fee'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {paymentMethodLabel(p.paymentMethod)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={p.status === 'success' ? 'success' : 'warning'}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDownloadReceipt(p)}
                        className="btn btn-outline btn-sm border-gray-300 text-gray-700 hover:text-primary-600 hover:border-primary-400 inline-flex items-center gap-1.5"
                        title="Download official PDF receipt"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Sidebar>
  )
}
