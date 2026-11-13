import { useState } from 'react'
import {
  Layers,
  Plus,
  Clock,
  MapPin,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Users,
  Sparkles
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'

export default function BatchesView({
  batches = [],
  students = [],
  settings = {},
  onOpenAddBatch,
  onEditBatch,
  onDeleteBatch,
  onViewStudent,
}) {
  const [expandedBatchId, setExpandedBatchId] = useState(null)

  const toggleBatchExpand = (batchId) => {
    setExpandedBatchId((prev) => (prev === batchId ? null : batchId))
  }

  const currencySymbol = settings?.currencySymbol || '₹'

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-red-600" />
              Course Catalog
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{batches.length} Active Batches</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
            Batches & Courses
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage academic schedules, class capacities, fees, and student enrollments
          </p>
        </div>

        <button
          onClick={onOpenAddBatch}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition-colors cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Batch</span>
        </button>
      </div>

      {/* Batches Grid */}
      {batches.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center max-w-md mx-auto">
          <Layers className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-neutral-900">No Batches Configured</h3>
          <p className="text-xs text-neutral-500 mt-1 mb-4">
            Create your first coaching batch to start enrolling students and scheduling tests.
          </p>
          <button
            onClick={onOpenAddBatch}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Batch</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {batches.map((batch) => {
            const batchId = batch.id || batch._id || batch.batchId
            // Filter enrolled active students
            const enrolled = students.filter((s) => {
              if (s.status !== 'active') return false
              const sBatches = s.batchIds || []
              return (
                sBatches.includes(batchId) ||
                sBatches.includes(batch.id) ||
                sBatches.includes(batch.batchId) ||
                s.batch === batch.name ||
                (s.grade || s.class) === batch.grade
              )
            })

            const isExpanded = expandedBatchId === batchId
            const capacity = Number(batch.capacity || 30)
            const fillPercent = capacity > 0 ? Math.round((enrolled.length / capacity) * 100) : 0
            const monthlyProjection = enrolled.length * Number(batch.monthlyFee || 0)

            return (
              <div
                key={batchId}
                className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:border-neutral-300 transition-all flex flex-col justify-between shadow-2xs hover:shadow-sm"
              >
                <div className="p-5">
                  {/* Top Bar: Subject, Grade & Monthly Fee */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full inline-block">
                        {batch.subject || 'Mathematics'} · {batch.grade}
                      </span>
                      <h2 className="text-base font-bold text-neutral-900 mt-1.5 leading-snug">
                        {batch.name}
                      </h2>
                    </div>
                    <span className="text-sm font-bold font-mono text-neutral-900 tabular-nums shrink-0 bg-neutral-50 px-2.5 py-1 rounded-lg border border-neutral-200">
                      {formatCurrency(batch.monthlyFee, currencySymbol)}
                      <span className="text-xs font-normal text-neutral-500">/mo</span>
                    </span>
                  </div>

                  {/* Batch Details */}
                  <div className="mt-3.5 space-y-2 text-xs text-neutral-600">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>
                        Faculty: <strong className="text-neutral-800">{batch.instructor || 'Vanita Rani Gupta'}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="font-mono text-neutral-700">{batch.schedule || 'Daily Batch'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>{batch.room || 'Vanita Math Classes, Vishal Nagar'}</span>
                    </div>
                  </div>

                  {/* Enrolled Capacity Bar */}
                  <div className="mt-4 pt-3 border-t border-neutral-100">
                    <div className="flex items-center justify-between text-xs text-neutral-500 mb-1.5">
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-neutral-400" />
                        Enrolled Strength
                      </span>
                      <span className="font-mono font-semibold text-neutral-900">
                        {enrolled.length} / {capacity} ({fillPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          fillPercent >= 90
                            ? 'bg-amber-500'
                            : fillPercent >= 75
                            ? 'bg-emerald-600'
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${Math.min(100, fillPercent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Monthly Projection */}
                  <div className="mt-3.5 py-2 px-3 bg-neutral-50 rounded-lg flex items-center justify-between text-xs border border-neutral-100">
                    <span className="text-neutral-500 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Monthly Projection:
                    </span>
                    <span className="font-mono font-bold text-neutral-900 tabular-nums">
                      {formatCurrency(monthlyProjection, currencySymbol)}
                    </span>
                  </div>
                </div>

                {/* Enrolled Students Expandable Drawer */}
                {isExpanded && (
                  <div className="border-t border-neutral-200 bg-neutral-50/70 p-4 max-h-52 overflow-y-auto">
                    <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Enrolled Students ({enrolled.length})</span>
                      <span className="text-[11px] font-normal text-neutral-400 lowercase">click student to view</span>
                    </h4>
                    {enrolled.length === 0 ? (
                      <p className="text-xs text-neutral-400 italic py-2">
                        No active students enrolled in this batch yet.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {enrolled.map((student) => (
                          <div
                            key={student.id || student._id}
                            className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-white rounded-lg border border-neutral-200 hover:border-red-300 transition-colors"
                          >
                            <button
                              type="button"
                              onClick={() => onViewStudent && onViewStudent(student)}
                              className="font-medium text-neutral-800 hover:text-red-600 text-left truncate cursor-pointer flex items-center gap-1.5"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span>{student.name}</span>
                              <span className="text-[11px] font-mono text-neutral-400">({student.rollNo})</span>
                            </button>
                            <a
                              href={`tel:${student.phone}`}
                              className="font-mono text-neutral-500 hover:text-neutral-800 text-[11px]"
                            >
                              {student.phone}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Card Footer: Expand toggle, Edit, Delete */}
                <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50/40 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => toggleBatchExpand(batchId)}
                    className="text-neutral-600 hover:text-neutral-900 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span>
                      {isExpanded ? 'Hide' : 'View'} Students ({enrolled.length})
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditBatch && onEditBatch(batch)}
                      className="p-1.5 text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg cursor-pointer transition-colors"
                      title="Edit Batch"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Are you sure you want to delete batch "${batch.name}"?`
                          )
                        ) {
                          onDeleteBatch && onDeleteBatch(batchId)
                        }
                      }}
                      className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer transition-colors"
                      title="Delete Batch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
