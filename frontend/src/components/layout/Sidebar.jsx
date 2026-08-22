import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { announcementService } from '@/services'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import {
  LayoutDashboard, Users, DollarSign, BookOpen, Bell, Calendar,
  LogOut, Menu, X, GraduationCap, ClipboardList, BarChart3,
  Upload, ChevronDown, Settings, UserCheck, Mail, ClipboardCheck 
} from 'lucide-react'

const ADMIN_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
  { label: 'Students', icon: Users, to: '/admin/students' },
  { label: 'Teachers', icon: UserCheck, to: '/admin/teachers' },
  { label: 'Fee Management', icon: DollarSign, to: '/admin/fees' },
  { label: 'Payments', icon: ClipboardList, to: '/admin/payments' },
  { label: 'Attendance', icon: Calendar, to: '/admin/attendance' },
  { label: 'Announcements', icon: Bell, to: '/admin/announcements' },
  { label: 'Study Materials', icon: BookOpen, to: '/admin/materials' },
  { label: 'Inquiries', icon: Mail, to: '/admin/inquiries' },
  { label: 'Reports', icon: BarChart3, to: '/admin/reports' },
  { label: 'Test Reports', icon: ClipboardCheck, to: '/admin/test-reports' },
  { label: 'Settings', icon: Settings, to: '/admin/settings' },

]

const STUDENT_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'My Fees', icon: DollarSign, to: '/dashboard/fees' },
  { label: 'Payment History', icon: ClipboardList, to: '/dashboard/payments' },
  { label: 'Attendance', icon: Calendar, to: '/dashboard/attendance' },
  { label: 'Announcements', icon: Bell, to: '/dashboard/notices' },
  { label: 'Study Materials', icon: BookOpen, to: '/dashboard/materials' },
  { label: 'Test Reports', icon: ClipboardCheck, to: '/dashboard/test-reports' },
  { label: 'Profile', icon: UserCheck, to: '/dashboard/profile' },
  { label: 'Settings', icon: Settings, to: '/dashboard/settings' },
]

const TEACHER_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/teacher' },
  { label: 'Students', icon: Users, to: '/teacher/students' },
  { label: 'Attendance', icon: Calendar, to: '/teacher/attendance' },
  { label: 'Announcements', icon: Bell, to: '/teacher/announcements' },
  { label: 'Study Materials', icon: BookOpen, to: '/teacher/materials' },
  { label: 'Settings', icon: Settings, to: '/teacher/settings' },
]

export default function Sidebar({ children }) {
  const { user, isAdmin, isTeacher, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const nav = isAdmin ? ADMIN_NAV : isTeacher ? TEACHER_NAV : STUDENT_NAV

  // Poll for unread announcements to power the nav badge (simple real-time-feel without websockets)
  const { data: announcementsData } = useQuery({
    queryKey: ['announcements', 'unread-badge'],
    queryFn: () => announcementService.getAll({ limit: 1 }),
    refetchInterval: 30000,
  })
  const unreadCount = announcementsData?.unreadCount ?? 0

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-100">
        <img src="/fab2.jpeg" alt="Vanita Math Classes logo" className="w-8 h-8 rounded-lg object-contain flex-shrink-0" />
        <div>
          <p className="font-bold text-slate-900 text-sm leading-tight">Vanita Math </p>
          <p className="text-xs text-slate-500">Classes</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(item => {
          const active = location.pathname === item.to || (item.to !== '/admin' && item.to !== '/dashboard' && item.to !== '/teacher' && location.pathname.startsWith(item.to))
          const isAnnouncementLink = item.icon === Bell
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn('sidebar-link', active && 'active')}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isAnnouncementLink && unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <Avatar name={user?.name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
          <button onClick={handleLogout} title="Logout" className="btn-ghost p-1.5 rounded-lg">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-slate-200 fixed inset-y-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative w-64 bg-white border-r border-slate-200 flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-60 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-20">
          <button onClick={() => setOpen(true)} className="btn-ghost p-2 rounded-lg"><Menu className="w-5 h-5" /></button>
          <div className="flex items-center gap-2">
            <img src="/fab2.jpeg" alt="Vanita Maths Classes logo" className="w-5 h-5 rounded object-contain flex-shrink-0" />
            <span className="font-bold text-slate-900 text-sm">Vanita Math</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
