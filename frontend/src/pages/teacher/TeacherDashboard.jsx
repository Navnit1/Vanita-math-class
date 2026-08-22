import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, StatCard, SectionCard, Badge } from '@/components/ui'
import { studentService, announcementService } from '@/services'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, formatDateTime } from '@/lib/utils'
import { Users, Calendar, BookOpen, Bell, ArrowRight, AlertCircle } from 'lucide-react'

export default function TeacherDashboard() {
  const { user } = useAuth()

  const { data: studentData, isLoading } = useQuery({
    queryKey: ['students-all'],
    queryFn: () => studentService.getAll({ limit: 5, status: 'active' }),
  })

  const { data: announcementsData } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementService.getAll({ limit: 50 }),
  })

  if (isLoading) return <Sidebar><PageLoader /></Sidebar>

  const students = studentData?.students || []
  const total = studentData?.total || 0
  const announcements = announcementsData?.announcements || []

  return (
    <Sidebar>
      <div className="page-header">
        <h1 className="page-title">Welcome, {user?.name?.split(' ')[0]}!</h1>
        <p className="page-subtitle">Teacher Dashboard · {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Students" value={total} icon={Users} color="blue" />
        <StatCard title="Active Students" value={studentData?.students?.filter(s => s.status === 'active').length || 0} icon={Users} color="green" />
        <StatCard title="Announcements" value={announcements.length} icon={Bell} color="purple" />
        <StatCard title="Study Materials" value="—" icon={BookOpen} color="orange" subtitle="See materials page" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent students */}
        <SectionCard
          title="Recent Students"
          action={<Link to="/teacher/students" className="text-xs text-primary-600 font-medium flex items-center gap-1">All students <ArrowRight className="w-3 h-3" /></Link>}
        >
          <div className="divide-y divide-slate-50">
            {students.map(s => (
              <div key={s._id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{s.fullName}</p>
                  <p className="text-xs text-slate-500">{s.class} · {s.batch}</p>
                </div>
                <Badge variant={s.status === 'active' ? 'green' : 'red'}>{s.status}</Badge>
              </div>
            ))}
            {students.length === 0 && <p className="text-sm text-slate-500 px-5 py-4">No students found.</p>}
          </div>
        </SectionCard>

        {/* Announcements */}
        <SectionCard
          title="Announcements"
          action={<Link to="/teacher/announcements" className="text-xs text-primary-600 font-medium flex items-center gap-1">Manage <ArrowRight className="w-3 h-3" /></Link>}
        >
          <div className="divide-y divide-slate-50">
            {announcements.slice(0, 5).map(a => (
              <div key={a._id} className="px-5 py-3">
                <div className="flex items-start gap-2">
                  {a.priority === 'high' && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-sm font-medium text-slate-900">{a.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(a.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
            {announcements.length === 0 && <p className="text-sm text-slate-500 px-5 py-4">No announcements yet.</p>}
          </div>
        </SectionCard>
      </div>
    </Sidebar>
  )
}
