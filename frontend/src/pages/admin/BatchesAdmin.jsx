import { useQuery } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, EmptyState, Badge } from '@/components/ui'
import { batchService } from '@/services'
import { BATCH_DEFINITIONS } from '@/config/pricing'
import { formatCurrency } from '@/lib/utils'
import {
  Users, Clock, GraduationCap, ArrowRight, PlusCircle,
  ClipboardCheck, BookOpen, DollarSign, Sparkles, AlertCircle
} from 'lucide-react'

export default function BatchesAdmin() {
  const navigate = useNavigate()

  const { data: batchesData, isLoading, refetch } = useQuery({
    queryKey: ['admin-batches'],
    queryFn: batchService.getAll,
    refetchInterval: 15000,
  })

  const batches = (batchesData && batchesData.length > 0)
    ? batchesData
    : BATCH_DEFINITIONS.map(b => ({ ...b, enrolledCount: 0, enrollmentPercentage: 0 }))

  const totalEnrolled = batches.reduce((acc, b) => acc + (b.enrolledCount || 0), 0)
  const totalCapacity = batches.reduce((acc, b) => acc + (b.maxCapacity || 30), 0)
  const expectedMonthlyRevenue = batches.reduce((acc, b) => acc + ((b.enrolledCount || 0) * (b.monthlyFee || 0)), 0)

  return (
    <Sidebar>
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2">
            Batches & Standards Management
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FFF5F5] text-[#C90019] border border-[#FFCCD0]">
              5 Standards
            </span>
          </h1>
          <p className="page-subtitle">
            Authoritative standard fees, real-time database enrollment counts, classroom capacities, and schedules.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/admin/students?action=new')}
            className="btn btn-primary btn-sm flex items-center gap-1.5 font-bold shadow-red-glow text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            Enroll Student
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-[#E50914] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#64748B]">Active Enrolled Students</p>
            <p className="text-2xl font-black text-[#171717]">{totalEnrolled}</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">Across all 5 standards in database</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#64748B]">Expected Monthly Tuition Revenue</p>
            <p className="text-2xl font-black text-[#059669]">{formatCurrency(expectedMonthlyRevenue)}</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">Calculated from verified standard fees</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#64748B]">Total Capacity Utilization</p>
            <p className="text-2xl font-black text-[#171717]">
              {totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0}%
            </p>
            <p className="text-[11px] text-[#64748B] mt-0.5">{totalEnrolled} filled / {totalCapacity} total seats</p>
          </div>
        </div>
      </div>

      {/* Batches Grid */}
      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {batches.map((b) => {
            const count = b.enrolledCount || 0
            const cap = b.maxCapacity || 30
            const pct = b.enrollmentPercentage || Math.min(100, Math.round((count / cap) * 100))
            const isFull = pct >= 100

            return (
              <div
                key={b.standard}
                className="card p-6 border border-[#D9DDE3] hover:border-[#E50914] transition-all hover:shadow-card flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Class & Fee */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black px-3 py-1 rounded-full bg-[#FFF5F5] text-[#C90019] border border-[#FFCCD0]">
                        {b.standardLabel}
                      </span>
                      <span className="text-xs font-semibold text-[#64748B]">
                        Std: <strong>{b.standard}</strong>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-[#171717]">
                        {formatCurrency(b.monthlyFee)}
                      </span>
                      <span className="text-[11px] text-[#64748B] block font-medium">per month (fixed)</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-[#171717] mb-1">
                    {b.batchTitle}
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed mb-4">
                    {b.description || b.focus}
                  </p>

                  {/* Schedule & Faculty Pill */}
                  <div className="p-3 bg-[#FAFAFA] border border-[#D9DDE3] rounded-xl text-xs space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-[#171717]">
                      <Clock className="w-3.5 h-3.5 text-[#E50914] shrink-0" />
                      <span className="font-semibold">{b.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#64748B]">
                      <GraduationCap className="w-3.5 h-3.5 text-[#E50914] shrink-0" />
                      <span>{b.faculty}</span>
                    </div>
                  </div>

                  {/* Enrollment Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-[#171717] font-semibold flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#E50914]" />
                        <strong>{count}</strong> Active Students
                      </span>
                      <span className="text-xs font-bold">
                        {isFull ? (
                          <span className="text-[#C90019]">Batch Full ({cap}/{cap})</span>
                        ) : (
                          <span className="text-[#64748B]">{cap - count} Seats Available ({pct}% filled)</span>
                        )}
                      </span>
                    </div>
                    <div className="w-full bg-[#F3F4F6] rounded-full h-2.5 overflow-hidden border border-[#D9DDE3]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct >= 90 ? 'bg-[#C90019]' : pct >= 60 ? 'bg-[#F59E0B]' : 'bg-[#E50914]'
                        }`}
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Batch Actions Toolbar */}
                <div className="pt-4 border-t border-[#D9DDE3] flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => navigate(`/admin/students?class=${encodeURIComponent(b.standard)}`)}
                    className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Users className="w-3.5 h-3.5" />
                    View Student Directory
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/admin/test-reports?class=${encodeURIComponent(b.standard)}`)}
                      className="btn btn-secondary btn-sm text-xs flex items-center gap-1"
                      title="Manage tests for this class"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5 text-[#E50914]" />
                      Tests
                    </button>

                    <button
                      onClick={() => navigate(`/admin/materials?class=${encodeURIComponent(b.standard)}`)}
                      className="btn btn-secondary btn-sm text-xs flex items-center gap-1"
                      title="Manage notes for this class"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#E50914]" />
                      Notes
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Sidebar>
  )
}
