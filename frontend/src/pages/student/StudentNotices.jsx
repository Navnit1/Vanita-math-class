// StudentNotices.jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, Badge, EmptyState } from '@/components/ui'
import { announcementService } from '@/services'
import { formatDateTime, cn } from '@/lib/utils'
import { Bell, AlertCircle, Circle } from 'lucide-react'

export function StudentNotices() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementService.getAll({ limit: 50 }),
    refetchInterval: 30000, // poll for a "real-time" feel without a websocket layer
  })

  const markReadMutation = useMutation({
    mutationFn: announcementService.markRead,
    onSuccess: () => qc.invalidateQueries(['announcements']),
  })

  const announcements = data?.announcements || []
  const unreadCount = data?.unreadCount ?? announcements.filter(a => !a.isRead).length

  return (
    <Sidebar>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2.5">
            Announcements
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="page-subtitle">{announcements.length} active notices{unreadCount > 0 ? ` · ${unreadCount} unread` : ''}</p>
        </div>
      </div>
      {isLoading ? <PageLoader /> : announcements.length === 0 ? (
        <div className="card"><EmptyState icon={Bell} title="No announcements" description="Check back later for updates from your institute." /></div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <button
              key={a._id}
              onClick={() => !a.isRead && markReadMutation.mutate(a._id)}
              className={cn(
                'card p-5 border-l-4 w-full text-left transition-colors',
                a.priority === 'high' ? 'border-l-red-400' : a.priority === 'medium' ? 'border-l-yellow-400' : 'border-l-slate-200',
                !a.isRead && 'bg-primary-50/40'
              )}
            >
              <div className="flex items-start gap-2 mb-1">
                {!a.isRead && <Circle className="w-2 h-2 mt-1.5 fill-primary-600 text-primary-600 flex-shrink-0" />}
                {a.priority === 'high' && <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />}
                <h3 className={cn('text-sm flex-1', !a.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700')}>{a.title}</h3>
                {a.class && <Badge variant="blue">Std {a.class}</Badge>}
                <Badge variant={a.priority === 'high' ? 'red' : a.priority === 'medium' ? 'yellow' : 'slate'}>{a.priority}</Badge>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mt-2">{a.content}</p>
              <p className="text-xs text-slate-400 mt-3">{formatDateTime(a.createdAt)} · By {a.createdBy?.name}</p>
            </button>
          ))}
        </div>
      )}
    </Sidebar>
  )
}

export default StudentNotices
