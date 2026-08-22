import { useQuery } from '@tanstack/react-query'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, Badge, EmptyState } from '@/components/ui'
import { paymentService } from '@/services'
import { formatCurrency, formatDate, paymentMethodLabel } from '@/lib/utils'
import { ClipboardList, CheckCircle, Download, CreditCard, Wifi, WifiOff } from 'lucide-react'

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

function downloadReceipt(paymentId, receiptNumber) {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || ''
  const url = `${apiBase}/payments/${paymentId}/receipt`
  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  // Pass auth token via URL won't work for auth-protected routes; open in new tab instead
  window.open(url, '_blank')
}

function downloadCSV(payments) {
  const rows = [
    ['Receipt No', 'Amount', 'Method', 'Type', 'Date', 'Month', 'Transaction ID', 'Status'],
    ...payments.map(p => [
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
  const csv = rows.map(r => r.join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
}

export default function StudentPayments() {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['my-payments'],
    queryFn: paymentService.getMyPayments,
  })

  if (isLoading) return <Sidebar><PageLoader /></Sidebar>

  const total = payments.reduce((s, p) => s + p.amount, 0)
  const onlineTotal = payments.filter(p => p.paymentType === 'online').reduce((s, p) => s + p.amount, 0)
  const offlineTotal = payments.filter(p => p.paymentType !== 'online').reduce((s, p) => s + p.amount, 0)

  return (
    <Sidebar>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Payment History</h1>
          <p className="page-subtitle">{payments.length} payments · {formatCurrency(total)} total</p>
        </div>
        {payments.length > 0 && (
          <button onClick={() => downloadCSV(payments)} className="btn btn-secondary btn-sm">
            <Download className="w-3.5 h-3.5" /> Download CSV
          </button>
        )}
      </div>

      {/* Summary cards */}
      {payments.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="stat-card">
            <p className="text-xs text-slate-500 font-medium">Total Paid</p>
            <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(total)}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-1.5 mb-1">
              <Wifi className="w-3.5 h-3.5 text-blue-500" />
              <p className="text-xs text-slate-500 font-medium">Online</p>
            </div>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(onlineTotal)}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-1.5 mb-1">
              <WifiOff className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-xs text-slate-500 font-medium">Offline</p>
            </div>
            <p className="text-xl font-bold text-slate-700">{formatCurrency(offlineTotal)}</p>
          </div>
        </div>
      )}

      <div className="table-container">
        {payments.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No payments yet"
            description="Your payment history will appear here once recorded."
          />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Receipt No</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Type</th>
                <th>Date</th>
                <th>Month</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p._id}>
                  <td>
                    <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {p.receiptNumber}
                    </span>
                  </td>
                  <td>
                    <span className="font-semibold text-green-600">{formatCurrency(p.amount)}</span>
                  </td>
                  <td>
                    <span className="text-sm">{paymentMethodLabel(p.paymentMethod)}</span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.paymentType === 'online'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {p.paymentType === 'online'
                        ? <><CreditCard className="w-3 h-3" /> Online</>
                        : 'Offline'}
                    </span>
                  </td>
                  <td><span className="text-sm">{formatDate(p.paymentDate)}</span></td>
                  <td><span className="text-sm text-slate-600">{p.month || '—'}</span></td>
                  <td>
                    <Badge variant={p.status === 'verified' ? 'green' : 'slate'}>
                      {p.status === 'verified'
                        ? <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified</span>
                        : 'Recorded'}
                    </Badge>
                  </td>
                  <td>
                    <button
                      onClick={() => downloadReceipt(p._id, p.receiptNumber)}
                      className="btn btn-ghost btn-sm p-1.5 text-primary-600"
                      title="Download Receipt PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Sidebar>
  )
}
