import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, Select, Badge, EmptyState, Pagination, Modal, FormField } from '@/components/ui'
import { contactService } from '@/services'
import { formatDateTime, cn } from '@/lib/utils'
import {
  Mail, Phone, MessageSquare, Inbox, UserPlus, ExternalLink,
  CheckCircle2, Copy, Check, Sparkles, School, Calendar, Clock, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_VARIANTS = {
  new: 'red',
  contacted: 'yellow',
  enrolled: 'green',
  closed: 'slate',
}

const CLASSES = ['8th', '9th', '10th', '+1', '+2']
const BATCHES = ['Evening', 'Morning', 'Weekend']

export default function Inquiries() {
  const [page, setPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [enrollModalOpen, setEnrollModalOpen] = useState(false)
  const [credentialsModal, setCredentialsModal] = useState(null)
  const [copied, setCopied] = useState(false)

  // Form state for enrollment modal
  const [enrollForm, setEnrollForm] = useState({
    fullName: '',
    parentName: '',
    parentPhone: '',
    studentClass: '10th',
    batch: 'Evening',
    school: '',
    monthlyFee: 2500,
    totalFee: 25000,
    discount: 0,
    admissionDate: new Date().toISOString().slice(0, 10),
    sendNotification: true,
  })

  const qc = useQueryClient()

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['inquiries', page, filterStatus, search],
    queryFn: () => contactService.getAll({ page, limit: 15, status: filterStatus || undefined, search: search || undefined }),
    refetchInterval: 15000,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => contactService.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries(['inquiries'])
      toast.success('Enquiry status updated')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to update status'),
  })

  const enrollMutation = useMutation({
    mutationFn: ({ id, payload }) => contactService.enroll(id, payload),
    onSuccess: (res) => {
      qc.invalidateQueries(['inquiries'])
      qc.invalidateQueries(['students'])
      qc.invalidateQueries(['admin-dashboard'])
      setEnrollModalOpen(false)
      setCredentialsModal(res.data)
      toast.success(res.message || 'Student enrolled successfully!')
    },
    onError: err => toast.error(err.response?.data?.message || 'Enrollment failed'),
  })

  const handleOpenEnrollModal = (inq) => {
    setSelectedInquiry(inq)
    setEnrollForm({
      fullName: inq.name || '',
      parentName: inq.parentName || '',
      parentPhone: inq.phone || '',
      studentClass: inq.class || '10th',
      batch: inq.preferredBatch || 'Evening',
      school: inq.school || '',
      monthlyFee: 2500,
      totalFee: 25000,
      discount: 0,
      admissionDate: new Date().toISOString().slice(0, 10),
      sendNotification: true,
    })
    setEnrollModalOpen(true)
  }

  const handleEnrollSubmit = (e) => {
    e.preventDefault()
    if (!selectedInquiry) return
    enrollMutation.mutate({
      id: selectedInquiry._id,
      payload: enrollForm,
    })
  }

  const copyCredentials = (creds) => {
    const text = `Vanita Math Classes Login Credentials\nRoll Number: ${creds.studentId}\nUsername: ${creds.username}\nTemporary Password: ${creds.tempPassword}\nPortal: ${window.location.origin}/login`
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Credentials copied to clipboard')
    setTimeout(() => setCopied(false), 2500)
  }

  const inquiries = data?.inquiries || []
  const total = data?.total || 0
  const pages = data?.pages || 1
  const newCount = inquiries.filter(i => i.status === 'new').length

  return (
    <Sidebar>
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Student Enquiries & Admissions</h1>
          <p className="page-subtitle">
            {total} enquiries received from the public website. Review, follow up, and approve admissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search enquiries…"
            className="input text-xs sm:text-sm w-44 sm:w-56"
          />

          <Select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
            className="w-36 text-xs sm:text-sm"
          >
            <option value="">All Statuses</option>
            <option value="new">New ({newCount})</option>
            <option value="contacted">Contacted</option>
            <option value="enrolled">Enrolled</option>
            <option value="closed">Closed</option>
          </Select>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
            title="Refresh enquiries list"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {newCount > 0 && !filterStatus && (
        <div className="mb-5 flex items-center justify-between gap-2.5 bg-[#FFF5F5] border border-[#FFCCD0] text-[#C90019] rounded-xl px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 shrink-0" />
            <span className="font-semibold">
              {newCount} new student inquir{newCount > 1 ? 'ies' : 'y'} requiring follow-up!
            </span>
          </div>
          <button
            onClick={() => setFilterStatus('new')}
            className="text-xs font-bold underline hover:text-[#A50014]"
          >
            Filter New
          </button>
        </div>
      )}

      {isLoading ? (
        <PageLoader />
      ) : inquiries.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No enquiries found"
          description="Enquiries submitted by prospective students through the website's Contact and Admission section will appear here."
        />
      ) : (
        <div className="space-y-3.5">
          {inquiries.map(inq => {
            const isEnrolled = inq.status === 'enrolled'
            return (
              <div
                key={inq._id}
                className={cn(
                  'bg-white border rounded-xl p-4 sm:p-5 transition-all shadow-card',
                  inq.status === 'new' ? 'border-[#FFCCD0] bg-[#FFF5F5]/30' : 'border-[#D9DDE3]'
                )}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Student Details */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-[#171717]">{inq.name}</h3>
                      <Badge variant={STATUS_VARIANTS[inq.status] || 'slate'} className="capitalize">
                        {inq.status}
                      </Badge>
                      <Badge variant="primary">Class {inq.class}</Badge>
                      {inq.message?.includes('[Online Student Registration]') && (
                        <span className="text-[11px] font-bold text-[#C90019] bg-[#FFF5F5] border border-[#FFCCD0] px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#E50914]" />
                          Online Registration
                        </span>
                      )}
                      {inq.preferredBatch && (
                        <span className="text-xs text-[#64748B] bg-[#F3F4F6] border border-[#D9DDE3] px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#E50914]" />
                          {inq.preferredBatch} Batch
                        </span>
                      )}
                      {inq.school && (
                        <span className="text-xs text-[#64748B] flex items-center gap-1">
                          <School className="w-3.5 h-3.5 text-[#64748B]" />
                          {inq.school}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#64748B] flex-wrap">
                      {inq.parentName && (
                        <span>Parent: <strong className="text-[#171717]">{inq.parentName}</strong></span>
                      )}
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-[#E50914]" />
                        <strong className="text-[#171717]">{inq.phone}</strong>
                      </span>
                      {inq.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" /> {inq.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {formatDateTime(inq.createdAt)}
                      </span>
                    </div>

                    {inq.message && (
                      <div className="mt-2 text-xs sm:text-sm text-[#171717] bg-[#FAFAFA] border border-[#D9DDE3] rounded-lg p-2.5 flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-[#E50914] shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{inq.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {/* Call Button */}
                    <a
                      href={inq.callLink}
                      className="btn btn-secondary btn-sm flex items-center gap-1 text-[#171717]"
                      title="Call student/parent"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#059669]" />
                      Call
                    </a>

                    {/* Manual WhatsApp Fallback */}
                    <a
                      href={inq.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm flex items-center gap-1 text-[#059669] hover:bg-emerald-50 hover:border-emerald-300"
                      title="Open WhatsApp on web or mobile to send message manually"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open WhatsApp (Manual)
                    </a>

                    {/* Status Select */}
                    <Select
                      value={inq.status}
                      onChange={e => statusMutation.mutate({ id: inq._id, status: e.target.value })}
                      className="w-28 text-xs py-1.5"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="enrolled">Enrolled</option>
                      <option value="closed">Closed</option>
                    </Select>

                    {/* Approve & Enroll Button */}
                    {!isEnrolled ? (
                      <button
                        onClick={() => handleOpenEnrollModal(inq)}
                        className="btn btn-primary btn-sm flex items-center gap-1 font-semibold shadow-xs"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Approve & Enroll
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#059669] bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Enrolled
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          <Pagination page={page} pages={pages} onPage={p => setPage(p)} />
        </div>
      )}

      {/* ADMISSION APPROVAL MODAL */}
      <Modal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        title="Approve Admission & Create Student Account"
        size="lg"
      >
        <form onSubmit={handleEnrollSubmit} className="p-6 space-y-4">
          <div className="bg-[#FFF5F5] border border-[#FFCCD0] rounded-xl p-3.5 text-xs text-[#C90019] flex items-start gap-2">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Admin-Approved Admission Workflow:</p>
              <p className="mt-0.5 text-[#171717]">
                Approving this enquiry will automatically generate a unique Student ID (Roll No), unique username, and secure temporary password. Credentials will be presented securely after creation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Student Full Name" required>
              <input
                type="text"
                value={enrollForm.fullName}
                onChange={e => setEnrollForm({ ...enrollForm, fullName: e.target.value })}
                className="input"
                required
              />
            </FormField>

            <FormField label="Parent / Guardian Name" required>
              <input
                type="text"
                value={enrollForm.parentName}
                onChange={e => setEnrollForm({ ...enrollForm, parentName: e.target.value })}
                className="input"
                required
              />
            </FormField>

            <FormField label="Contact / Parent Phone" required>
              <input
                type="text"
                value={enrollForm.parentPhone}
                onChange={e => setEnrollForm({ ...enrollForm, parentPhone: e.target.value })}
                className="input"
                required
              />
            </FormField>

            <FormField label="Class / Standard" required>
              <Select
                value={enrollForm.studentClass}
                onChange={e => setEnrollForm({ ...enrollForm, studentClass: e.target.value })}
              >
                {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
              </Select>
            </FormField>

            <FormField label="Batch Timing" required>
              <Select
                value={enrollForm.batch}
                onChange={e => setEnrollForm({ ...enrollForm, batch: e.target.value })}
              >
                {BATCHES.map(b => <option key={b} value={b}>{b} Batch</option>)}
              </Select>
            </FormField>

            <FormField label="School Name">
              <input
                type="text"
                value={enrollForm.school}
                onChange={e => setEnrollForm({ ...enrollForm, school: e.target.value })}
                placeholder="e.g. DPS / St. Joseph"
                className="input"
              />
            </FormField>

            <FormField label="Monthly Tuition Fee (₹)" required>
              <input
                type="number"
                min="0"
                value={enrollForm.monthlyFee}
                onChange={e => {
                  const m = Number(e.target.value)
                  setEnrollForm({
                    ...enrollForm,
                    monthlyFee: m,
                    totalFee: m * 10,
                  })
                }}
                className="input"
                required
              />
            </FormField>

            <FormField label="Scholarship / Discount (₹)" hint="Deducted from total fees">
              <input
                type="number"
                min="0"
                value={enrollForm.discount}
                onChange={e => setEnrollForm({ ...enrollForm, discount: Number(e.target.value) })}
                className="input"
              />
            </FormField>

            <FormField label="Admission Date" required>
              <input
                type="date"
                value={enrollForm.admissionDate}
                onChange={e => setEnrollForm({ ...enrollForm, admissionDate: e.target.value })}
                className="input"
                required
              />
            </FormField>

            <FormField label="Total Academic Year Fee (₹)" hint="Calculated or custom total">
              <input
                type="number"
                min="0"
                value={enrollForm.totalFee}
                onChange={e => setEnrollForm({ ...enrollForm, totalFee: Number(e.target.value) })}
                className="input"
                required
              />
            </FormField>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="sendNotification"
              checked={enrollForm.sendNotification}
              onChange={e => setEnrollForm({ ...enrollForm, sendNotification: e.target.checked })}
              className="rounded border-[#D9DDE3] text-[#E50914] focus:ring-[#E50914]"
            />
            <label htmlFor="sendNotification" className="text-xs text-[#171717] font-medium cursor-pointer">
              Send admission confirmation and login credentials via WhatsApp Cloud API (if configured)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#D9DDE3]">
            <button
              type="button"
              onClick={() => setEnrollModalOpen(false)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={enrollMutation.isPending}
              className="btn btn-primary btn-sm font-semibold shadow-red-glow"
            >
              {enrollMutation.isPending ? 'Enrolling Student…' : 'Confirm Admission & Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CREDENTIALS DISPLAY MODAL (PROTECTED ADMIN WORKFLOW) */}
      <Modal
        isOpen={Boolean(credentialsModal)}
        onClose={() => setCredentialsModal(null)}
        title="Student Account Created — Save Credentials"
        size="md"
      >
        <div className="p-6 space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-2 text-[#059669]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-[#171717]">
              Admission Approved Successfully!
            </h3>
            <p className="text-xs text-[#64748B] mt-1">
              Please share these initial credentials with the student or parent. The student will be prompted to change their temporary password upon first login.
            </p>
          </div>

          {credentialsModal?.credentials && (
            <div className="bg-[#F3F4F6] border border-[#D9DDE3] rounded-xl p-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[#D9DDE3]">
                <span className="text-[#64748B]">Roll Number / Student ID:</span>
                <span className="font-bold text-[#171717] text-sm">
                  {credentialsModal.credentials.studentId}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#D9DDE3]">
                <span className="text-[#64748B]">Username:</span>
                <span className="font-bold text-[#171717] text-sm">
                  {credentialsModal.credentials.username}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[#64748B]">Temporary Password:</span>
                <span className="font-bold text-[#C90019] text-sm">
                  {credentialsModal.credentials.tempPassword}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => copyCredentials(credentialsModal.credentials)}
              className="btn btn-secondary flex-1 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-[#059669]" /> : <Copy className="w-4 h-4 text-[#E50914]" />}
              {copied ? 'Copied to Clipboard' : 'Copy Credentials'}
            </button>

            {credentialsModal?.whatsAppLink && (
              <a
                href={credentialsModal.whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary flex-1 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <ExternalLink className="w-4 h-4" />
                Share via WhatsApp
              </a>
            )}
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={() => setCredentialsModal(null)}
              className="text-xs font-semibold text-[#64748B] hover:text-[#171717]"
            >
              Done & Close
            </button>
          </div>
        </div>
      </Modal>
    </Sidebar>
  )
}
