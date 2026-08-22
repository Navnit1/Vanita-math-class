import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, Select, Badge, EmptyState, Pagination } from '@/components/ui'
import { contactService } from '@/services'
import { formatDateTime, cn } from '@/lib/utils'
import { Mail, Phone, MessageSquare, Inbox } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_COLORS = { new: 'blue', contacted: 'yellow', closed: 'slate' }

export default function Inquiries() {
  const [page, setPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['inquiries', page, filterStatus],
    queryFn: () => contactService.getAll({ page, limit: 15, status: filterStatus || undefined }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => contactService.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries(['inquiries']); toast.success('Status updated') },
    onError: err => toast.error(err.response?.data?.message || 'Failed to update status'),
  })

  const inquiries = data?.inquiries || []
  const total = data?.total || 0
  const pages = data?.pages || 1
  const newCount = inquiries.filter(i => i.status === 'new').length

  return (
    <Sidebar>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Contact Inquiries</h1>
          <p className="page-subtitle">{total} messages from the website's Contact form</p>
        </div>
        <Select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }} className="w-40">
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="closed">Closed</option>
        </Select>
      </div>

      {newCount > 0 && (
        <div className="mb-4 flex items-center gap-2.5 text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm">
          <Inbox className="w-4.5 h-4.5 shrink-0" />
          <span>{newCount} new inquir{newCount > 1 ? 'ies' : 'y'} on this page haven't been followed up yet.</span>
        </div>
      )}

      {isLoading ? (
        <PageLoader />
      ) : inquiries.length === 0 ? (
        <EmptyState icon={Mail} title="No inquiries yet" description="Messages submitted through the website's Contact form will show up here." />
      ) : (
        <div className="space-y-3">
          {inquiries.map(inq => (
            <div key={inq._id} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-slate-900">{inq.name}</h3>
                    <Badge variant={STATUS_COLORS[inq.status] || 'slate'}>{inq.status}</Badge>
                    {inq.interestedStandard && <Badge variant="slate">{inq.interestedStandard}</Badge>}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 flex-wrap">
                    <a href={`mailto:${inq.email}`} className="flex items-center gap-1 hover:text-primary-600">
                      <Mail className="w-3.5 h-3.5" /> {inq.email}
                    </a>
                    {inq.phone && (
                      <a href={`tel:${inq.phone}`} className="flex items-center gap-1 hover:text-primary-600">
                        <Phone className="w-3.5 h-3.5" /> {inq.phone}
                      </a>
                    )}
                    <span>{formatDateTime(inq.createdAt)}</span>
                  </div>
                </div>
                <Select
                  value={inq.status}
                  onChange={e => statusMutation.mutate({ id: inq._id, status: e.target.value })}
                  className="w-32 shrink-0"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </Select>
              </div>
              <p className="mt-3 text-sm text-slate-700 flex gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{inq.message}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Pagination page={page} pages={pages} onPage={setPage} />
      </div>
    </Sidebar>
  )
}