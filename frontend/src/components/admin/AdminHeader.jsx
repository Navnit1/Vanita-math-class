import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  BookOpen,
  GraduationCap,
  Receipt,
  TriangleAlert,
  Sparkles,
  Settings as SettingsIcon,
  Plus,
  PenLine,
  Upload,
  LogOut,
  CreditCard
} from 'lucide-react'

export default function AdminHeader({
  activeTab,
  setActiveTab,
  settings = {},
  onOpenRecordPayment,
  onOpenAddStudent,
  onOpenScheduleTest,
  onOpenInputMarks,
  onOpenPostNotes,
  onOpenCreateBatch,
  onLogout,
  dueCount = 0,
  enquiryCount = 0,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'tests', label: 'Test Management', icon: ClipboardList },
    { id: 'notes', label: 'Math Notes', icon: BookOpen },
    { id: 'batches', label: 'Batches', icon: GraduationCap },
    { id: 'ledger', label: 'Fee Ledger', icon: Receipt },
    { id: 'dues', label: 'Due Fees', icon: TriangleAlert, badge: dueCount > 0 ? dueCount : undefined },
    { id: 'enquiries', label: 'Enquiries', icon: Sparkles, badge: enquiryCount > 0 ? enquiryCount : undefined },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ]

  const handleTabClick = (tabId) => {
    setActiveTab(tabId)
    setMobileMenuOpen(false)
  }

  return (
    <header className="no-print sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-sm">
      {/* Scarlet/Crimson Top Header Bar */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white py-2 px-3 sm:px-6 lg:px-8 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Logo & Institute Branding */}
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg shadow-sm flex items-center justify-center shrink-0">
              <img
                src="/vmc-logo.svg"
                alt="VMC Logo"
                className="h-7 sm:h-9 w-auto object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight uppercase font-serif leading-none text-white drop-shadow-xs">
                {settings.centerName || 'VANITA MATH CLASSES'}
              </h1>
              <p className="text-[10px] sm:text-xs text-rose-100 font-medium tracking-wide">
                {settings.tagline || 'Mathmatics tuition classes for 8th, 9th, 10th, +1 & +2'} · Faculty: {settings.facultyName ? settings.facultyName.split('(')[0] : 'Vanita Rani Gupta'} (17+ yrs exp)
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={onOpenRecordPayment}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-lg shadow-sm transition-all cursor-pointer ring-1 ring-emerald-500"
              title="Record student fee payment"
            >
              <CreditCard className="w-3.5 h-3.5 shrink-0" />
              <span>+ Record Fee</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddStudent}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-900 bg-white hover:bg-rose-50 active:bg-neutral-100 rounded-lg shadow-sm transition-all cursor-pointer"
              title="Enroll a new student"
            >
              <Plus className="w-3.5 h-3.5 shrink-0 text-red-600" />
              <span>+ Add Student</span>
            </button>

            <button
              type="button"
              onClick={onOpenInputMarks || (() => handleTabClick('tests'))}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-300 hover:bg-amber-200 active:bg-amber-400 rounded-lg shadow-sm transition-all cursor-pointer"
              title="Input student weekly test marks"
            >
              <PenLine className="w-3.5 h-3.5 shrink-0 text-amber-900" />
              <span>✍️ Input Marks</span>
            </button>

            <button
              type="button"
              onClick={onOpenPostNotes || (() => handleTabClick('notes'))}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-sky-950 bg-sky-300 hover:bg-sky-200 active:bg-sky-400 rounded-lg shadow-sm transition-all cursor-pointer"
              title="Upload class study notes / PDF"
            >
              <Upload className="w-3.5 h-3.5 shrink-0 text-sky-900" />
              <span>📤 Upload Notes</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 text-rose-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer ml-1"
              title="Logout from Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-neutral-100/90 border-b border-neutral-300">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between py-1.5">
            <nav className="flex items-center gap-2 overflow-x-auto lg:flex-wrap py-1 w-full lg:w-auto scrollbar-none">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabClick(item.id)}
                    style={{
                      backgroundColor: isActive ? '#18181b' : '#ffffff',
                      color: isActive ? '#ffffff' : '#1f2937',
                      borderColor: isActive ? '#09090b' : '#d1d5db',
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                      isActive
                        ? 'shadow-md ring-2 ring-neutral-800'
                        : 'hover:bg-neutral-50 hover:text-neutral-950 shadow-2xs'
                    }`}
                  >
                    <Icon
                      className="w-4 h-4 shrink-0"
                      style={{ color: isActive ? '#facc15' : '#4b5563' }}
                    />
                    <span style={{ color: isActive ? '#ffffff' : '#1f2937', fontWeight: isActive ? 800 : 600 }}>
                      {item.label}
                    </span>

                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 ring-2 ring-neutral-900" />
                    )}

                    {item.badge !== undefined && (
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded-full font-black ml-0.5"
                        style={{
                          backgroundColor: isActive ? '#facc15' : '#dc2626',
                          color: isActive ? '#18181b' : '#ffffff',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>

            <div className="hidden xl:flex items-center gap-3 text-xs font-medium text-neutral-600 shrink-0 pl-4 border-l border-neutral-300">
              <span className="font-mono bg-white border border-neutral-300 px-2 py-0.5 rounded text-neutral-800 font-semibold shadow-2xs">
                Session {settings.academicYear || '2026-2027'}
              </span>
              <span className="text-neutral-400">|</span>
              <span className="text-neutral-900 font-bold">Admin: Vikas</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
