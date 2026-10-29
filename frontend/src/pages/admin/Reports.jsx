import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, TabBar, SectionCard, Badge, EmptyState } from '@/components/ui'
import { adminService } from '@/services'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BarChart3, Download } from 'lucide-react'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const PIE_COLORS = ['#22c55e', '#f59e0b', '#94a3b8', '#ef4444']

function downloadCSV(data, filename, headers) {
  const csv = [headers.join(','), ...data.map(row => headers.map(h => {
    const key = h.toLowerCase().replace(/ /g, '_')
    const val = row[key] ?? row[Object.keys(row).find(k => k.toLowerCase() === key)] ?? ''
    return `"${String(val).replace(/"/g, '""')}"`
  }).join(','))].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState('revenue')
  const [year, setYear] = useState(new Date().getFullYear())

  const { data: revenueData, isLoading: revLoading } = useQuery({
    queryKey: ['report-revenue', year],
    queryFn: () => adminService.getReports({ type: 'revenue', year }),
    enabled: activeTab === 'revenue',
  })

  const { data: feeData, isLoading: feeLoading } = useQuery({
    queryKey: ['report-fees'],
    queryFn: () => adminService.getReports({ type: 'fees' }),
    enabled: activeTab === 'fees',
  })

  const { data: attendanceData, isLoading: attLoading } = useQuery({
    queryKey: ['report-attendance'],
    queryFn: () => adminService.getReports({ type: 'attendance' }),
    enabled: activeTab === 'attendance',
  })

  const { data: studentData, isLoading: stuLoading } = useQuery({
    queryKey: ['report-students'],
    queryFn: () => adminService.getReports({ type: 'students' }),
    enabled: activeTab === 'students',
  })

  // Build revenue chart data
  const revenueChart = MONTH_NAMES.map((month, i) => {
    const entry = (revenueData || []).find(r => r._id?.month === i + 1)
    return { month, revenue: entry?.total || 0, count: entry?.count || 0 }
  })

  const totalRevenue = revenueChart.reduce((s, r) => s + r.revenue, 0)

  // Fee breakdown for pie chart
  const feeBreakdown = (() => {
    if (!feeData) return []
    const map = { paid: 0, partial: 0, pending: 0, overdue: 0 }
    feeData.forEach(f => { if (f.paymentStatus in map) map[f.paymentStatus]++ })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  })()

  return (
    <Sidebar>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Analytics and export tools</p>
        </div>
      </div>

      <TabBar
        tabs={[
          { value: 'revenue', label: 'Revenue' },
          { value: 'fees', label: 'Fee Report' },
          { value: 'attendance', label: 'Attendance' },
          { value: 'students', label: 'Students' },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {/* Revenue Report */}
      {activeTab === 'revenue' && (
        <div className="mt-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="label mb-0">Year</label>
              <select value={year} onChange={e => setYear(Number(e.target.value))} className="input w-28">
                {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-600">Total: <strong className="text-slate-900">{formatCurrency(totalRevenue)}</strong></p>
              <button onClick={() => downloadCSV(revenueChart, 'revenue-report', ['Month', 'Revenue', 'Count'])} className="btn btn-secondary btn-sm">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
          </div>

          <SectionCard title={`Monthly Revenue — ${year}`}>
            {revLoading ? <PageLoader /> : (
              <div className="p-4">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={revenueChart} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                      tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                    <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="revenue" fill="#E50914" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <div className="table-container">
            <table className="table">
              <thead><tr><th>Month</th><th>Revenue</th><th>Payments</th></tr></thead>
              <tbody>
                {revenueChart.map(r => (
                  <tr key={r.month}>
                    <td>{r.month} {year}</td>
                    <td><span className="font-semibold text-green-600">{formatCurrency(r.revenue)}</span></td>
                    <td>{r.count}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50">
                  <td className="font-semibold">Total</td>
                  <td><span className="font-bold text-slate-900">{formatCurrency(totalRevenue)}</span></td>
                  <td><span className="font-semibold">{revenueChart.reduce((s, r) => s + r.count, 0)}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fee Report */}
      {activeTab === 'fees' && (
        <div className="mt-5 space-y-5">
          <div className="flex justify-end">
            <button onClick={() => feeData && downloadCSV(feeData.map(f => ({
              student: f.studentId?.fullName, id: f.studentId?.studentId,
              class: f.studentId?.class, batch: f.studentId?.batch,
              amount: f.amount, paid: f.paidAmount, status: f.paymentStatus, month: f.month,
            })), 'fee-report', ['Student', 'ID', 'Class', 'Batch', 'Amount', 'Paid', 'Status', 'Month'])}
              className="btn btn-secondary btn-sm"><Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SectionCard title="Fee Status Breakdown">
              {feeLoading ? <PageLoader /> : (
                <div className="p-4 flex justify-center">
                  <PieChart width={280} height={220}>
                    <Pie data={feeBreakdown} cx={140} cy={110} innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {feeBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </div>
              )}
            </SectionCard>
            <div className="table-container" style={{ maxHeight: 280, overflowY: 'auto' }}>
              {feeLoading ? <PageLoader /> : (
                <table className="table">
                  <thead><tr><th>Student</th><th>Amount</th><th>Status</th><th>Month</th></tr></thead>
                  <tbody>
                    {(feeData || []).map(f => (
                      <tr key={f._id}>
                        <td>
                          <p className="text-sm font-medium">{f.studentId?.fullName}</p>
                          <p className="text-xs text-slate-500">{f.studentId?.class} · {f.studentId?.batch}</p>
                        </td>
                        <td>{formatCurrency(f.amount)}</td>
                        <td><Badge variant={f.paymentStatus === 'paid' ? 'green' : f.paymentStatus === 'partial' ? 'yellow' : f.paymentStatus === 'overdue' ? 'red' : 'slate'}>{f.paymentStatus}</Badge></td>
                        <td className="text-xs text-slate-500">{f.month || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attendance Report */}
      {activeTab === 'attendance' && (
        <div className="mt-5 space-y-4">
          <div className="flex justify-end">
            <button onClick={() => attendanceData && downloadCSV(attendanceData, 'attendance-report', ['Student', 'ID', 'Class', 'Batch', 'Total', 'Present', 'Absent', 'Percentage'])}
              className="btn btn-secondary btn-sm"><Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
          <div className="table-container">
            {attLoading ? <PageLoader /> : !(attendanceData || []).length ? (
              <EmptyState icon={BarChart3} title="No attendance data" description="Mark attendance for batches to see reports here." />
            ) : (
              <table className="table">
                <thead><tr><th>Student</th><th>Class / Batch</th><th>Total</th><th>Present</th><th>Absent</th><th>Attendance %</th></tr></thead>
                <tbody>
                  {(attendanceData || []).map(s => (
                    <tr key={s._id}>
                      <td>
                        <p className="font-medium text-sm">{s.fullName}</p>
                        <p className="text-xs text-slate-500">{s.studentId}</p>
                      </td>
                      <td>{s.class} · {s.batch}</td>
                      <td>{s.total}</td>
                      <td className="text-green-600 font-medium">{s.present}</td>
                      <td className="text-red-500 font-medium">{s.absent}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full"><div className={`h-full rounded-full ${s.percentage >= 75 ? 'bg-green-500' : s.percentage >= 50 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{ width: `${s.percentage}%` }} /></div>
                          <span className={`text-sm font-medium ${s.percentage >= 75 ? 'text-green-600' : s.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{s.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Students Report */}
      {activeTab === 'students' && (
        <div className="mt-5 space-y-4">
          <div className="flex justify-end">
            <button onClick={() => studentData && downloadCSV(studentData.map(s => ({
              name: s.fullName, id: s.studentId, class: s.class, batch: s.batch,
              phone: s.phone, parent: s.parentName, parent_phone: s.parentPhone,
              total_fee: s.totalFee, paid: s.paidFee, fee_status: s.feeStatus, status: s.status,
            })), 'student-report', ['Name', 'ID', 'Class', 'Batch', 'Phone', 'Parent', 'Parent Phone', 'Total Fee', 'Paid', 'Fee Status', 'Status'])}
              className="btn btn-secondary btn-sm"><Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
          <div className="table-container">
            {stuLoading ? <PageLoader /> : (
              <table className="table">
                <thead><tr><th>Student</th><th>Class</th><th>Batch</th><th>Total Fee</th><th>Paid</th><th>Fee Status</th><th>Status</th></tr></thead>
                <tbody>
                  {(studentData || []).map(s => (
                    <tr key={s._id}>
                      <td>
                        <p className="font-medium text-sm">{s.fullName}</p>
                        <p className="text-xs text-slate-500">{s.studentId}</p>
                      </td>
                      <td>{s.class}</td>
                      <td>{s.batch}</td>
                      <td>{formatCurrency(s.totalFee)}</td>
                      <td className="text-green-600 font-medium">{formatCurrency(s.paidFee)}</td>
                      <td><Badge variant={s.feeStatus === 'paid' ? 'green' : s.feeStatus === 'partial' ? 'yellow' : s.feeStatus === 'overdue' ? 'red' : 'slate'}>{s.feeStatus}</Badge></td>
                      <td><Badge variant={s.status === 'active' ? 'green' : 'red'}>{s.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </Sidebar>
  )
}
