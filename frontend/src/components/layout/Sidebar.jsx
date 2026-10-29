import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { announcementService, contactService } from '@/services'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import {
  LayoutDashboard, Users, DollarSign, BookOpen, Bell, Calendar,
  LogOut, Menu, X, ClipboardList, BarChart3,
  Settings, UserCheck, Mail, ClipboardCheck, Phone
} from 'lucide-react'

const ADMIN_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
  { label: 'Enquiries', icon: Mail, to: '/admin/inquiries' },
  { label: 'Students', icon: Users, to: '/admin/students' },
  { label: 'Weekly Tests & Marks', icon: ClipboardCheck, to: '/admin/test-reports' },
  { label: 'Fee Management', icon: DollarSign, to: '/admin/fees' },
  { label: 'Receipts & Payments', icon: ClipboardList, to: '/admin/payments' },
  { label: 'Math Notes (PDFs)', icon: BookOpen, to: '/admin/materials' },
  { label: 'Attendance', icon: Calendar, to: '/admin/attendance' },
  { label: 'Announcements', icon: Bell, to: '/admin/announcements' },
  { label: 'Reports', icon: BarChart3, to: '/admin/reports' },
  { label: 'Settings', icon: Settings, to: '/admin/settings' },
]

const STUDENT_NAV = [
  { label: 'My Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Weekly Tests & Results', icon: ClipboardCheck, to: '/dashboard/test-reports' },
  { label: 'My Fees & Dues', icon: DollarSign, to: '/dashboard/fees' },
  { label: 'Payment Receipts', icon: ClipboardList, to: '/dashboard/payments' },
  { label: 'Math Notes (PDFs)', icon: BookOpen, to: '/dashboard/materials' },
  { label: 'Attendance', icon: Calendar, to: '/dashboard/attendance' },
  { label: 'Notice Board', icon: Bell, to: '/dashboard/notices' },
  { label: 'My Profile', icon: UserCheck, to: '/dashboard/profile' },
  { label: 'Settings', icon: Settings, to: '/dashboard/settings' },
]

export default function Sidebar({ children }) {
  const { user, isAdmin, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const nav = isAdmin ? ADMIN_NAV : STUDENT_NAV

  // Badges: unread announcements count
  const { data: announcementsData } = useQuery({
    queryKey: ['announcements', 'unread-badge'],
    queryFn: () => announcementService.getAll({ limit: 1 }),
    refetchInterval: 30000,
  })
  const unreadAnnouncements = announcementsData?.unreadCount ?? 0

  // Admin badge: new inquiries count
  const { data: inquiriesData } = useQuery({
    queryKey: ['inquiries', 'new-badge'],
    queryFn: () => contactService.getAll({ status: 'new', limit: 1 }),
    enabled: Boolean(isAdmin),
    refetchInterval: 30000,
  })
  const newInquiries = inquiriesData?.total ?? 0

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-[#D9DDE3]">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#D9DDE3] bg-[#FAFAFA]">
        <img
          src="/fab2.jpeg"
          alt="Vanita Math Classes logo"
          className="w-9 h-9 rounded-lg object-contain border border-[#D9DDE3] bg-white p-0.5 shrink-0"
        />
        <div className="min-w-0">
          <p className="font-extrabold text-[#171717] text-sm leading-tight tracking-tight uppercase">
            Vanita Math Classes
          </p>
          <p className="text-[11px] font-semibold text-[#E50914] flex items-center gap-1 mt-0.5">
            <span>Maths 8th–+2</span>
            <span className="text-[#64748B]">·</span>
            <span className="text-[#64748B] font-normal truncate">Bathinda</span>
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(item => {
          const active = location.pathname === item.to || (item.to !== '/admin' && item.to !== '/dashboard' && location.pathname.startsWith(item.to))
          const isAnnouncement = item.icon === Bell
          const isInquiry = item.icon === Mail

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-[#FFF5F5] text-[#C90019] font-semibold border-l-4 border-[#E50914] pl-2.5 shadow-xs'
                  : 'text-[#64748B] hover:bg-[#F3F4F6] hover:text-[#171717]'
              )}
            >
              <item.icon className={cn('w-4 h-4 shrink-0', active ? 'text-[#E50914]' : 'text-[#64748B]')} />
              <span className="flex-1 truncate">{item.label}</span>

              {isAnnouncement && unreadAnnouncements > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#E50914] text-white text-[10px] font-bold">
                  {unreadAnnouncements > 9 ? '9+' : unreadAnnouncements}
                </span>
              )}

              {isInquiry && newInquiries > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#E50914] text-white text-[10px] font-bold">
                  {newInquiries}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Faculty / Contact Footer Pill */}
      <div className="px-4 py-2.5 mx-3 mb-2 rounded-lg bg-[#FAFAFA] border border-[#D9DDE3]">
        <p className="text-[11px] font-bold text-[#171717]">Vanita Rani Gupta</p>
        <p className="text-[10px] text-[#64748B]">M.Sc., M.Phil., B.Ed. (17+ Yrs)</p>
        <a href="tel:9815962612" className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[#E50914] hover:underline">
          <Phone className="w-3 h-3" /> 98159-62612
        </a>
      </div>

      {/* User profile & Logout */}
      <div className="p-3 border-t border-[#D9DDE3] bg-[#FAFAFA]">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <Avatar name={user?.name || 'User'} src={user?.profilePhoto} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#171717] truncate">{user?.name}</p>
            <p className="text-[10px] font-medium text-[#64748B] truncate capitalize">
              {isAdmin ? 'Administrator' : `Class ${user?.profile?.class || 'Student'}`}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#C90019] hover:bg-[#FFF5F5] transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col lg:flex-row">
      {/* Mobile Sticky Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-[#D9DDE3] px-4 py-3 flex items-center justify-between shadow-xs">
        <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2">
          <img src="/fab2.jpeg" alt="Logo" className="w-7 h-7 rounded-md object-contain border border-[#D9DDE3]" />
          <span className="font-extrabold text-[#171717] text-sm tracking-tight">VANITA MATH CLASSES</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-[#171717] hover:bg-[#F3F4F6]"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-72 max-w-[85vw] h-full z-10 shadow-xl animate-slide-up">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
