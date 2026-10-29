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
    refetchInterval: 30000,
  })

  const markReadMutation = useMutation({
    mutationFn: announcementService.markRead,
    onSuccess: () => qc.invalidateQueries(['announcements']),
  })

  const announcements = data?.announcements || []
  const unreadCount = data?.unreadCount ?? announcements.filter((a) => !a.isRead).length

  return (
    <Sidebar>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2.5">
            Announcements & Notices
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary-600 text-white text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="page-subtitle">
            {announcements.length} notices
            {unreadCount > 0 ? ` · ${unreadCount} unread` : ''} · Official updates from Vanita Rani Gupta
          </p>
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : announcements.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Bell}
            title="No announcements"
            description="All new class announcements and test schedules will appear here."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <button
              key={a._id}
              onClick={() => !a.isRead && markReadMutation.mutate(a._id)}
              className={cn(
                'card p-5 border-l-4 w-full text-left transition-all hover:shadow-sm',
                a.priority === 'high'
                  ? 'border-l-primary-600 bg-red-50/20'
                  : a.priority === 'medium'
                  ? 'border-l-amber-500'
                  : 'border-l-gray-300',
                !a.isRead && 'ring-1 ring-primary-200'
              )}
            >
              <div className="flex flex-wrap items-start gap-2 mb-1">
                {!a.isRead && (
                  <Circle className="w-2.5 h-2.5 mt-1.5 fill-primary-600 text-primary-600 shrink-0" />
                )}
                {a.priority === 'high' && (
                  <AlertCircle className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
                )}
                <h3
                  className={cn(
                    'text-sm flex-1',
                    !a.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'
                  )}
                >
                  {a.title}
                </h3>
                {a.class && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200">
                    Class {a.class}
                  </span>
                )}
                <Badge
                  variant={
                    a.priority === 'high' ? 'danger' : a.priority === 'medium' ? 'warning' : 'slate'
                  }
                >
                  {a.priority}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mt-2 whitespace-pre-line">
                {a.content}
              </p>
              <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                <span>{formatDateTime(a.createdAt)}</span>
                <span className="font-medium text-gray-500">Vanita Math Classes</span>
              </p>
            </button>
          ))}
        </div>
      )}
    </Sidebar>
  )
}

export default StudentNotices
