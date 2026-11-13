import { useState } from 'react'
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
  Eye,
  Printer
} from 'lucide-react'
import toast from 'react-hot-toast'
import FeeReceiptModal from '@/components/admin/modals/FeeReceiptModal'

function downloadCSV(payments) {
  const rows = [
    ['Receipt No', 'Amount', 'Method', 'Type', 'Date', 'Month', 'Transaction ID', 'Status'],
    ...payments.map((p) => [
      p.receiptNumber || p.receiptNo,
      p.amount,
      paymentMethodLabel(p.paymentMethod || p.paymentMode),
      p.paymentType || 'offline',
      new Date(p.paymentDate).toLocaleDateString('en-IN'),
      p.month || '',
      p.transactionId || p.referenceNo || '',
      p.status || 'success',
    ]),
  ]
  const csv = rows.map((r) => r.join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `vmc-payments-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
}

export default function StudentPayments() {
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)

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

  const total = payments.reduce((s, p) => s + Number(p.amount || 0), 0)
  const onlineTotal = payments.filter((p) => p.paymentType === 'online').reduce((s, p) => s + Number(p.amount || 0), 0)
  const offlineTotal = payments.filter((p) => p.paymentType !== 'online').reduce((s, p) => s + Number(p.amount || 0), 0)

  const handleDownloadReceipt = async (p) => {
    try {
      toast.loading('Preparing receipt PDF...', { id: 'receipt-dl' })
      await paymentService.downloadReceipt(p._id || p.id, p.receiptNumber || p.receiptNo)
      toast.success('Receipt downloaded successfully!', { id: 'receipt-dl' })
    } catch {
      toast.error('Could not download receipt PDF. Opening interactive receipt slip instead.', { id: 'receipt-dl' })
      handleViewReceipt(p)
    }
  }

  const handleViewReceipt = (p) => {
    // Normalize payment object for FeeReceiptModal
    const normalized = {
      id: p.id || p._id,
      receiptNo: p.receiptNo || p.receiptNumber || 'VMC-REC',
      paymentDate: p.paymentDate || new Date().toISOString().slice(0, 10),
      month: p.month || 'Tuition Fee',
      amount: Number(p.amount || 0),
      discount: Number(p.discount || 0),
      paymentMode: p.paymentMode || paymentMethodLabel(p.paymentMethod) || 'Cash',
      referenceNo: p.referenceNo || p.transactionId || '',
      recordedBy: p.recordedBy || 'Admin (Er. Vikas)',
      notes: p.notes || ''
    }
    setSelectedReceipt(normalized)
    setIsReceiptModalOpen(true)
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
            className="btn btn-secondary btn-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {payments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-xs text-gray-500 font-medium">Total Paid</span>
            <p className="text-2xl font-black text-emerald-600 font-mono mt-1">
              {formatCurrency(total)}
            </p>
            <span className="text-xs text-gray-400 mt-1 block">
              {payments.length} lifetime receipts
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-xs text-gray-500 font-medium">Online Paid</span>
            <p className="text-2xl font-black text-gray-900 font-mono mt-1">
              {formatCurrency(onlineTotal)}
            </p>
            <span className="text-xs text-gray-400 mt-1 block">UPI / Net Banking / Gateway</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-xs text-gray-500 font-medium">Cash / Counter Paid</span>
            <p className="text-2xl font-black text-gray-900 font-mono mt-1">
              {formatCurrency(offlineTotal)}
            </p>
            <span className="text-xs text-gray-400 mt-1 block">Direct at Center</span>
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
                {payments.map((p) => {
                  const pId = p._id || p.id
                  const receiptNo = p.receiptNumber || p.receiptNo || 'VMC-REC'
                  return (
                    <tr key={pId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-red-600 shrink-0" />
                          <div>
                            <span className="font-mono font-bold text-gray-900 text-xs">
                              {receiptNo}
                            </span>
                            {(p.transactionId || p.referenceNo) && (
                              <p className="font-mono text-[10px] text-gray-400 truncate max-w-[120px]">
                                {p.transactionId || p.referenceNo}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        {formatDate(p.paymentDate)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600 font-mono">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-gray-800">
                        {p.month || 'Tuition Fee'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {p.paymentMode || paymentMethodLabel(p.paymentMethod)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={p.status === 'pending' ? 'warning' : 'success'}>
                          {p.status || 'success'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewReceipt(p)}
                            className="btn btn-secondary btn-sm text-xs inline-flex items-center gap-1"
                            title="View / Print Printable Receipt Slip"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Slip</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadReceipt(p)}
                            className="btn btn-outline btn-sm border-gray-300 text-gray-700 hover:text-red-600 hover:border-red-400 inline-flex items-center gap-1"
                            title="Download official PDF receipt"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Receipt Modal */}
      <FeeReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false)
          setSelectedReceipt(null)
        }}
        payment={selectedReceipt}
        student={null}
        batches={[]}
        settings={{
          centerName: 'Vanita Math Classes',
          tagline: 'Mathmatics tuition classes for 8th, 9th, 10th, +1 & +2',
          address: '#302, Phase-II, Vishal Nagar, Bathinda',
          phone: '98159-62612',
          email: 'singla_vikas123@yahhoo.com',
          facultyName: 'Vanita Rani Gupta (M.Sc, M.Phil, B.Ed)',
          receiptPrefix: 'VMC-REC-'
        }}
      />
    </Sidebar>
  )
}
