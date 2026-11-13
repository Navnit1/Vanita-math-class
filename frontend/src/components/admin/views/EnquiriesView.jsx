import { useState, useMemo } from 'react'
import {
  Inbox,
  Search,
  Phone,
  MessageCircle,
  UserCheck,
  Trash2,
  School,
  Clock,
  Sparkles,
  X
} from 'lucide-react'
import { formatDate } from '@/utils/formatters'

export default function EnquiriesView({
  enquiries = [],
  settings = {},
  onUpdateStatus,
  onDeleteEnquiry,
  onConvertToStudent,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredEnquiries = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    return enquiries.filter((e) => {
      const studentName = (e.studentName || e.name || '').toLowerCase()
      const parentName = (e.parentName || e.guardianName || '').toLowerCase()
      const phone = (e.phone || '')
      const grade = (e.grade || e.class || '').toLowerCase()

      const matchesSearch =
        !q ||
        studentName.includes(q) ||
        parentName.includes(q) ||
        phone.includes(q) ||
        grade.includes(q)

      const matchesStatus = statusFilter === 'all' || e.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [enquiries, searchTerm, statusFilter])

  const newCount = enquiries.filter((e) => e.status === 'new').length
  const contactedCount = enquiries.filter((e) => e.status === 'contacted').length
  const enrolledCount = enquiries.filter((e) => e.status === 'enrolled').length

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
            <span className="flex items-center gap-1">
              <Inbox className="w-3.5 h-3.5 text-red-600" />
              Vanita Math Classes Admissions
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{enquiries.length} Inquiries Received</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
            New Admission Enquiries
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Prospective student leads from the public website, phone calls, and direct consultations
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs bg-amber-100 text-amber-900 font-bold px-3 py-1.5 rounded-lg border border-amber-300">
            {newCount} New Enquiries Pending Follow-up
          </span>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white border border-neutral-200 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row gap-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, parent name, mobile number, or class..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-neutral-50/50"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="w-full md:w-56">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white font-medium"
          >
            <option value="all">All Statuses ({enquiries.length})</option>
            <option value="new">New ({newCount})</option>
            <option value="contacted">Contacted ({contactedCount})</option>
            <option value="enrolled">Enrolled / Admitted ({enrolledCount})</option>
          </select>
        </div>
      </div>

      {/* Enquiries Grid */}
      {filteredEnquiries.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center max-w-md mx-auto shadow-2xs">
          <Inbox className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-neutral-900">No Enquiries Found</h3>
          <p className="text-xs text-neutral-500 mt-1">
            New prospective students and parents who submit the website enquiry form will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEnquiries.map((enquiry) => {
            const eId = enquiry.id || enquiry._id
            const isNew = enquiry.status === 'new'
            const sName = enquiry.studentName || enquiry.name || 'Prospective Student'
            const pName = enquiry.parentName || enquiry.guardianName || 'Parent'
            const cleanPhone = (enquiry.phone || '').replace(/[^0-9]/g, '')
            const whatsappMsg = encodeURIComponent(
              `Hello ${pName}, this is Er. Vikas from Vanita Math Classes, Bathinda regarding ${sName}'s admission enquiry for ${enquiry.grade || 'Mathematics coaching'}.`
            )

            return (
              <div
                key={eId}
                className={`bg-white border rounded-xl overflow-hidden shadow-2xs hover:shadow-sm transition-all p-5 flex flex-col justify-between ${
                  isNew
                    ? 'border-amber-300 ring-2 ring-amber-300/40 bg-amber-50/10'
                    : 'border-neutral-200'
                }`}
              >
                <div>
                  {/* Top Bar: Grade badge + Status Selector */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                      {enquiry.grade || 'Mathematics'}
                    </span>
                    <select
                      value={enquiry.status || 'new'}
                      onChange={(e) => onUpdateStatus && onUpdateStatus(eId, e.target.value)}
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${
                        enquiry.status === 'new'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : enquiry.status === 'contacted'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      <option value="new">NEW</option>
                      <option value="contacted">CONTACTED</option>
                      <option value="enrolled">ENROLLED</option>
                    </select>
                  </div>

                  <h3 className="text-base font-bold text-neutral-900 mt-2">{sName}</h3>

                  <div className="mt-2 space-y-1.5 text-xs text-neutral-600">
                    <p className="flex items-center gap-1.5">
                      <span className="font-semibold text-neutral-800">Parent / Guardian:</span>{' '}
                      {pName}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-mono font-bold text-neutral-900">{enquiry.phone}</span>
                    </p>
                    {enquiry.schoolName && (
                      <p className="flex items-center gap-1.5 text-neutral-500">
                        <School className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>
                          {enquiry.schoolName} ({enquiry.board || 'CBSE'})
                        </span>
                      </p>
                    )}
                    {enquiry.batchTiming && (
                      <p className="flex items-center gap-1.5 text-neutral-500">
                        <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>Preferred Timing: {enquiry.batchTiming}</span>
                      </p>
                    )}
                  </div>

                  {enquiry.message && (
                    <div className="mt-3 p-2.5 bg-neutral-50 rounded-lg border border-neutral-100 text-xs text-neutral-700 italic">
                      "{enquiry.message}"
                    </div>
                  )}

                  <div className="mt-2 text-[10px] text-neutral-400 font-mono">
                    Received on: {formatDate(enquiry.createdAt)}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="mt-4 pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${enquiry.phone}`}
                      className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>Call</span>
                    </a>
                    <a
                      href={`https://wa.me/91${cleanPhone}?text=${whatsappMsg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-700" />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    {enquiry.status !== 'enrolled' && (
                      <button
                        type="button"
                        onClick={() => onConvertToStudent && onConvertToStudent(enquiry)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Enroll Student</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Remove enquiry for ${sName}?`)) {
                          onDeleteEnquiry && onDeleteEnquiry(eId)
                        }
                      }}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Enquiry"
                    >
                      <Trash2 className="w-4 h-4" />
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
