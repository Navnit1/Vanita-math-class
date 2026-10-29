import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { announcementService, contactService } from '@/services'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import {
  LayoutDashboard, Users, DollarSign, BookOpen, Bell, Calendar,
  LogOut, ClipboardList, Settings, UserCheck, Mail,
  ClipboardCheck, Phone, PlusCircle, CreditCard, PenTool,
  Upload, GraduationCap, Shield, Sparkles
} from 'lucide-react'

// Official Admin Navigation (in requested order)
const ADMIN_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
  { label: 'Students', icon: Users, to: '/admin/students' },
  { label: 'Weekly Tests', icon: ClipboardCheck, to: '/admin/test-reports' },
  { label: 'Math Notes', icon: BookOpen, to: '/admin/materials' },
  { label: 'Batches', icon: GraduationCap, to: '/admin/batches' },
  { label: 'Fee Ledger', icon: CreditCard, to: '/admin/payments' },
  { label: 'Due Fees', icon: DollarSign, to: '/admin/fees' },
  { label: 'Enquiries', icon: Mail, to: '/admin/inquiries', badgeKey: 'inquiries' },
  { label: 'Settings', icon: Settings, to: '/admin/settings' },
]

// Official Student Navigation
const STUDENT_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Weekly Tests', icon: ClipboardCheck, to: '/dashboard/test-reports' },
  { label: 'My Fees', icon: DollarSign, to: '/dashboard/fees' },
  { label: 'Receipts', icon: CreditCard, to: '/dashboard/payments' },
  { label: 'Math Notes', icon: BookOpen, to: '/dashboard/materials' },
  { label: 'Attendance', icon: Calendar, to: '/dashboard/attendance' },
  { label: 'Notices', icon: Bell, to: '/dashboard/notices', badgeKey: 'notices' },
  { label: 'My Profile', icon: UserCheck, to: '/dashboard/profile' },
  { label: 'Settings', icon: Settings, to: '/dashboard/settings' },
]

export default function Sidebar({ children }) {
  const { user, isAdmin, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

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
    refetchInterval: 20000,
  })
  const newInquiries = inquiriesData?.total ?? 0

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#F7F7F8] flex flex-col font-sans">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP RICH RED HORIZONTAL GRADIENT BRANDING HEADER
          Transitions from bright scarlet (#F00020) to deep red (#BD0010)
         ───────────────────────────────────────────────────────────── */}
      <header className="w-full bg-gradient-to-r from-[#F00020] via-[#D80016] to-[#BD0010] text-white shadow-md border-b border-[#99000D] px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: VMC Logo + Branding + Faculty Info */}
          <div className="flex items-center gap-3.5 sm:gap-4 shrink-0">
            {/* White rounded rectangular container for VMC logo */}
            <Link
              to={isAdmin ? '/admin' : '/dashboard'}
              className="h-11 w-20 sm:h-12 sm:w-24 bg-white rounded-xl p-1.5 flex items-center justify-center transition-transform hover:scale-102 shadow-md shrink-0"
              title="Vanita Math Classes"
            >
              <img
                src="/vmc-logo-official.png"
                alt="Vanita Math Classes"
                className="h-full w-auto object-contain"
              />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  to={isAdmin ? '/admin' : '/dashboard'}
                  className="font-black text-white text-base sm:text-xl tracking-tight leading-tight uppercase font-serif drop-shadow-xs truncate hover:underline"
                >
                  Vanita Math Classes
                </Link>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider">
                  {isAdmin ? 'Admin Portal' : 'Student Portal'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-red-100 font-medium truncate mt-0.5">
                Mathematics tuition classes for 8th, 9th, 10th, +1 and +2
              </p>
              <p className="text-[10px] sm:text-[11px] text-white/80 hidden md:block">
                Faculty: <strong>Vanita Rani Gupta</strong> (M.Sc., M.Phil., B.Ed., 17+ Yrs Exp) · Bathinda
              </p>
            </div>
          </div>

          {/* Right: Admin Quick Action Buttons + User Profile */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 sm:gap-3 shrink-0 pt-1 lg:pt-0 border-t border-white/15 lg:border-t-0">
            {/* Admin Quick Operations Pills */}
            {isAdmin && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => navigate('/admin/fees?action=record')}
                  className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs"
                  title="Record fee payment"
                >
                  <CreditCard className="w-3 h-3 text-red-200" />
                  <span>Record Fee</span>
                </button>

                <button
                  onClick={() => navigate('/admin/students?action=new')}
                  className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs"
                  title="Enroll a new student"
                >
                  <PlusCircle className="w-3 h-3 text-red-200" />
                  <span>Add Student</span>
                </button>

                <button
                  onClick={() => navigate('/admin/test-reports?tab=marks')}
                  className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs"
                  title="Input weekly test marks"
                >
                  <PenTool className="w-3 h-3 text-red-200" />
                  <span>Input Marks</span>
                </button>

                <button
                  onClick={() => navigate('/admin/materials?action=upload')}
                  className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs hidden sm:flex"
                  title="Upload class PDF notes"
                >
                  <Upload className="w-3 h-3 text-red-200" />
                  <span>Upload Notes</span>
                </button>
              </div>
            )}

            {/* User Profile Pill & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/20">
              <Avatar name={user?.name || 'User'} src={user?.profilePhoto} size="sm" className="border border-white/40 shadow-xs" />
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-[10px] text-red-200 truncate">
                  {isAdmin ? 'Administrator' : `Roll: ${user?.profile?.studentId || 'Student'}`}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Sign out of portal"
                aria-label="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. SUB-HEADER TOP-NAVIGATION BAR (Light-gray #F3F4F6)
          White rounded rectangular buttons with dark selected state
         ───────────────────────────────────────────────────────────── */}
      <nav className="w-full bg-[#F3F4F6] border-b border-[#D9DDE3] px-4 sm:px-6 lg:px-8 py-2 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2">
          {/* Navigation Pill Buttons (wrap neatly on narrower screens) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {nav.map((item) => {
              const isExact = location.pathname === item.to
              const isNested = item.to !== '/admin' && item.to !== '/dashboard' && location.pathname.startsWith(item.to)
              const active = isExact || isNested

              let badgeCount = 0
              if (item.badgeKey === 'inquiries') badgeCount = newInquiries
              if (item.badgeKey === 'notices') badgeCount = unreadAnnouncements

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs',
                    active
                      ? 'bg-[#1E293B] text-white border border-[#1E293B] font-bold'
                      : 'bg-white text-[#171717] border border-[#D9DDE3] hover:border-[#E50914] hover:text-[#E50914] hover:bg-white'
                  )}
                >
                  <item.icon
                    className={cn(
                      'w-3.5 h-3.5 shrink-0 transition-colors',
                      active ? 'text-[#FBBF24]' : 'text-[#64748B]'
                    )}
                  />
                  <span>{item.label}</span>

                  {badgeCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[#E50914] text-white text-[10px] font-black shrink-0">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Right Session & Contact Indicator */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-[#64748B] shrink-0 font-medium">
            <span className="px-2.5 py-1 rounded-md bg-white border border-[#D9DDE3] text-[#171717] font-bold text-[11px]">
              Academic Session 2026–2027
            </span>
            <a
              href="tel:9815962612"
              className="flex items-center gap-1 text-[#E50914] font-bold hover:underline"
            >
              <Phone className="w-3 h-3" /> 98159-62612
            </a>
          </div>
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN CONTENT CONTAINER (Spacious, responsive, clean)
         ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}
