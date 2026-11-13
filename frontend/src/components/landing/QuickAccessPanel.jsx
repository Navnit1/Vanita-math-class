import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Shield,
  GraduationCap,
  UserPlus,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MessageCircle,
  MapPin,
  Phone,
  Mail,
  Send,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { contactService, authService } from '@/services'

export default function QuickAccessPanel({ settings = {} }) {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [activeTab, setActiveTab] = useState('enquiry')

  // Common UI State
  const [showHelp, setShowHelp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // 1. Enquiry Form State
  const [enqStudentName, setEnqStudentName] = useState('')
  const [enqParentName, setEnqParentName] = useState('')
  const [enqPhone, setEnqPhone] = useState('')
  const [enqGrade, setEnqGrade] = useState('10th Class')
  const [enqSchool, setEnqSchool] = useState('')
  const [enqBoard, setEnqBoard] = useState('CBSE')
  const [enqTiming, setEnqTiming] = useState('Evening (5:00 PM - 6:30 PM)')
  const [enqMessage, setEnqMessage] = useState('')
  const [enquirySuccess, setEnquirySuccess] = useState(false)
  const [submittedEnquiry, setSubmittedEnquiry] = useState(null)

  // 2. Admin Login State
  const [adminUsername, setAdminUsername] = useState('vikas')
  const [adminPassword, setAdminPassword] = useState('vanita')
  const [showAdminPassword, setShowAdminPassword] = useState(false)

  // 3. Student Login State
  const [studentIdentifier, setStudentIdentifier] = useState('')
  const [studentPassword, setStudentPassword] = useState('vanita')
  const [showStudentPassword, setShowStudentPassword] = useState(false)

  // 4. Register State
  const [regName, setRegName] = useState('')
  const [regGrade, setRegGrade] = useState('10th Class')
  const [regPhone, setRegPhone] = useState('')
  const [regParentName, setRegParentName] = useState('')
  const [regParentPhone, setRegParentPhone] = useState('')
  const [regSchool, setRegSchool] = useState('')
  const [regPassword, setRegPassword] = useState('vanita')
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [regSuccess, setRegSuccess] = useState('')

  // Submit Enquiry
  const handleEnquirySubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    if (!enqStudentName.trim() || !enqParentName.trim() || !enqPhone.trim()) {
      setErrorMessage('Please fill in student name, parent name, and contact number.')
      return
    }

    setLoading(true)
    const payload = {
      studentName: enqStudentName.trim(),
      parentName: enqParentName.trim(),
      phone: enqPhone.trim(),
      grade: enqGrade,
      schoolName: enqSchool.trim() || 'Bathinda School',
      board: enqBoard,
      batchTiming: enqTiming,
      message: enqMessage.trim() || 'New admission enquiry from website home page.'
    }

    try {
      await contactService.submit(payload)
      setSubmittedEnquiry(payload)
      setEnquirySuccess(true)
      toast.success('Enquiry submitted successfully!')
    } catch {
      // Even if network blips, allow user to connect on WhatsApp
      setSubmittedEnquiry(payload)
      setEnquirySuccess(true)
    } finally {
      setLoading(false)
    }
  }

  // Admin Login
  const handleAdminLogin = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setLoading(true)

    try {
      const u = await login(adminUsername.trim(), adminPassword.trim())
      if (u?.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/admin')
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid admin credentials. (Default: vikas / vanita)'
      setErrorMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  // Student Login
  const handleStudentLogin = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setLoading(true)

    try {
      const u = await login(studentIdentifier.trim(), studentPassword.trim())
      if (u) {
        navigate('/dashboard')
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid Roll Number / Mobile or password. Please try again.'
      setErrorMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  // Register Student
  const handleRegister = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    if (!regName.trim() || !regPhone.trim() || !regParentName.trim() || !regParentPhone.trim()) {
      setErrorMessage('Please fill all mandatory fields.')
      return
    }

    setLoading(true)
    const payload = {
      name: regName.trim(),
      grade: regGrade,
      class: regGrade,
      phone: regPhone.trim(),
      guardianName: regParentName.trim(),
      guardianPhone: regParentPhone.trim(),
      schoolOrCollege: regSchool.trim() || 'Bathinda School',
      password: regPassword.trim() || 'vanita'
    }

    try {
      const res = await authService.register(payload)
      setRegSuccess(`Registration successful! Logging you in...`)
      toast.success('Welcome to Vanita Math Classes!')

      // Auto login
      setTimeout(async () => {
        try {
          await login(regPhone.trim(), regPassword.trim() || 'vanita')
          navigate('/dashboard')
        } catch {
          setActiveTab('student')
          setStudentIdentifier(regPhone.trim())
        }
      }, 1200)
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to complete registration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/95 backdrop-blur-md border border-neutral-200/90 rounded-2xl shadow-xl overflow-hidden">
      {/* Red gradient top accent bar */}
      <div className="h-2 bg-gradient-to-r from-red-600 via-rose-500 to-indigo-600" />

      {/* 4 Navigation Tabs */}
      <div className="p-3 sm:p-5 pb-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 p-1.5 bg-neutral-100 rounded-xl border border-neutral-300 gap-1.5">
          {/* 1. Enquiry Tab (Amber) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('enquiry')
              setErrorMessage('')
            }}
            style={{
              backgroundColor: activeTab === 'enquiry' ? '#f59e0b' : '#ffffff',
              color: activeTab === 'enquiry' ? '#451a03' : '#1f2937',
              borderColor: activeTab === 'enquiry' ? '#d97706' : '#d1d5db'
            }}
            className={`flex items-center justify-center gap-1 py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer border ${
              activeTab === 'enquiry' ? 'shadow-md ring-2 ring-amber-400' : 'hover:bg-neutral-50'
            }`}
          >
            <FileText
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: activeTab === 'enquiry' ? '#451a03' : '#d97706' }}
            />
            <span style={{ color: activeTab === 'enquiry' ? '#451a03' : '#1f2937', fontWeight: 800 }}>
              Enquiry
            </span>
          </button>

          {/* 2. Admin Login Tab (Red) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin')
              setErrorMessage('')
            }}
            style={{
              backgroundColor: activeTab === 'admin' ? '#dc2626' : '#ffffff',
              color: activeTab === 'admin' ? '#ffffff' : '#1f2937',
              borderColor: activeTab === 'admin' ? '#b91c1c' : '#d1d5db'
            }}
            className={`flex items-center justify-center gap-1 py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer border ${
              activeTab === 'admin' ? 'shadow-md ring-2 ring-red-400' : 'hover:bg-neutral-50'
            }`}
          >
            <Shield
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: activeTab === 'admin' ? '#ffffff' : '#dc2626' }}
            />
            <span style={{ color: activeTab === 'admin' ? '#ffffff' : '#1f2937', fontWeight: 800 }}>
              Admin Login
            </span>
          </button>

          {/* 3. Student Portal Tab (Indigo) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('student')
              setErrorMessage('')
            }}
            style={{
              backgroundColor: activeTab === 'student' ? '#4f46e5' : '#ffffff',
              color: activeTab === 'student' ? '#ffffff' : '#1f2937',
              borderColor: activeTab === 'student' ? '#4338ca' : '#d1d5db'
            }}
            className={`flex items-center justify-center gap-1 py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer border ${
              activeTab === 'student' ? 'shadow-md ring-2 ring-indigo-400' : 'hover:bg-neutral-50'
            }`}
          >
            <GraduationCap
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: activeTab === 'student' ? '#ffffff' : '#4f46e5' }}
            />
            <span style={{ color: activeTab === 'student' ? '#ffffff' : '#1f2937', fontWeight: 800 }}>
              Student Portal
            </span>
          </button>

          {/* 4. Register Tab (Emerald) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('register')
              setErrorMessage('')
            }}
            style={{
              backgroundColor: activeTab === 'register' ? '#059669' : '#ffffff',
              color: activeTab === 'register' ? '#ffffff' : '#1f2937',
              borderColor: activeTab === 'register' ? '#047857' : '#d1d5db'
            }}
            className={`flex items-center justify-center gap-1 py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer border ${
              activeTab === 'register' ? 'shadow-md ring-2 ring-emerald-400' : 'hover:bg-neutral-50'
            }`}
          >
            <UserPlus
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: activeTab === 'register' ? '#ffffff' : '#059669' }}
            />
            <span style={{ color: activeTab === 'register' ? '#ffffff' : '#1f2937', fontWeight: 800 }}>
              Register
            </span>
          </button>
        </div>
      </div>

      {/* Tab Panels Body */}
      <div className="px-5 py-4 sm:p-7 sm:pt-3">
        {/* Error message alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ===================== 1. ENQUIRY TAB ===================== */}
        {activeTab === 'enquiry' && (
          <div>
            {enquirySuccess ? (
              <div className="py-4 text-center space-y-4 animate-fade-in">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-900">
                    Enquiry Submitted Successfully!
                  </h3>
                  <p className="text-xs text-neutral-600 mt-1 max-w-md mx-auto">
                    Thank you, <strong>{submittedEnquiry?.studentName}</strong>! Your enquiry for{' '}
                    <strong>{submittedEnquiry?.grade}</strong> has been received by Er. Vikas.
                  </p>
                </div>

                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 max-w-md mx-auto text-left space-y-2.5 text-xs">
                  <div className="font-bold text-neutral-800 text-sm border-b border-neutral-200 pb-1.5 flex items-center justify-between">
                    <span>Vanita Math Classes, Bathinda</span>
                    <span className="text-[11px] font-normal text-neutral-500">Fast Response</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-700">
                    <MapPin className="w-4 h-4 text-red-600 shrink-0" />
                    <span>#302, Phase-II, Vishal Nagar, Bathinda</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-700">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Phone / WhatsApp: <strong>98159-62612</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-700">
                    <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      Email: <strong>singla_vikas123@yahhoo.com</strong>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <a
                    href={`https://wa.me/919815962612?text=${encodeURIComponent(
                      `Hello Er. Vikas Sir, I have submitted an admission enquiry at Vanita Math Classes for ${submittedEnquiry?.grade} for ${submittedEnquiry?.studentName} (Parent: ${submittedEnquiry?.parentName}). Please share batch timings and demo class schedule.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Connect on WhatsApp (98159-62612)</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setEnqStudentName('')
                      setEnqParentName('')
                      setEnqPhone('')
                      setEnqSchool('')
                      setEnqMessage('')
                      setEnquirySuccess(false)
                      setSubmittedEnquiry(null)
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-semibold rounded-xl text-xs cursor-pointer"
                  >
                    Submit Another Enquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="space-y-3.5">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Admissions Open for Session 2026-2027</span>
                  </div>
                  <p className="mt-1 text-[11px] text-amber-800">
                    Fill this enquiry form for mathematics coaching (8th, 9th, 10th, +1, +2).
                    Faculty Vanita Rani Gupta / Er. Vikas will contact you directly to schedule a demo session.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Student's Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aryan Sharma"
                      value={enqStudentName}
                      onChange={(e) => setEnqStudentName(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Father's / Mother's Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Sharma"
                      value={enqParentName}
                      onChange={(e) => setEnqParentName(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Mobile / WhatsApp No. <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 98159-XXXXX"
                      value={enqPhone}
                      onChange={(e) => setEnqPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs sm:text-sm text-neutral-900 font-mono placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Class / Grade Applying For <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={enqGrade}
                      onChange={(e) => setEnqGrade(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs sm:text-sm text-neutral-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    >
                      <option value="8th Class">Class 8th Mathematics</option>
                      <option value="9th Class">Class 9th Mathematics</option>
                      <option value="10th Class">Class 10th Mathematics (Board)</option>
                      <option value="+1 (11th) Mathematics">+1 (11th) Mathematics</option>
                      <option value="+2 (12th) Mathematics">+2 (12th) Mathematics (Board/JEE)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Current School / College
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. St. Xavier's, DAV Bathinda"
                      value={enqSchool}
                      onChange={(e) => setEnqSchool(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Education Board
                    </label>
                    <select
                      value={enqBoard}
                      onChange={(e) => setEnqBoard(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs sm:text-sm text-neutral-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    >
                      <option value="CBSE">CBSE Board</option>
                      <option value="ICSE">ICSE Board</option>
                      <option value="PSEB">PSEB (Punjab Board)</option>
                      <option value="Other">Other State Board</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Preferred Batch Timing
                  </label>
                  <select
                    value={enqTiming}
                    onChange={(e) => setEnqTiming(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs sm:text-sm text-neutral-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  >
                    <option value="Afternoon (3:30 PM - 4:45 PM)">Afternoon (3:30 PM - 4:45 PM)</option>
                    <option value="Evening (5:00 PM - 6:30 PM)">Evening (5:00 PM - 6:30 PM)</option>
                    <option value="Late Evening (6:45 PM - 8:15 PM)">Late Evening (6:45 PM - 8:15 PM)</option>
                    <option value="Any Batch">Flexible / Any Batch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Any Questions or Specific Goals (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Aiming for 100/100 in Board, need help in Trigonometry & Calculus..."
                    value={enqMessage}
                    onChange={(e) => setEnqMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-amber-950 font-black rounded-xl text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Submitting...' : 'Submit Admission Enquiry Now'}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* ===================== 2. ADMIN LOGIN TAB ===================== */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="text-center pb-2">
              <h2 className="text-lg font-bold text-neutral-900">Administrator Login</h2>
              <p className="text-xs text-neutral-500">
                Sign in to manage students, batches, marks & fees
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Enter admin username"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all"
                />
                <Shield className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all font-mono"
                />
                <span className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs">
                  *
                </span>
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 focus:outline-none cursor-pointer"
                  title={showAdminPassword ? 'Hide password' : 'Show password'}
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.01] disabled:opacity-50"
            >
              <Shield className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Access Admin Control Panel'}</span>
            </button>

            <div className="pt-2 flex items-center justify-between text-xs text-neutral-500">
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="text-neutral-500 hover:text-neutral-800 flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Login Help</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('enquiry')}
                className="text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
              >
                Need Admission? Click Here
              </button>
            </div>
          </form>
        )}

        {/* ===================== 3. STUDENT PORTAL TAB ===================== */}
        {activeTab === 'student' && (
          <form onSubmit={handleStudentLogin} className="space-y-4">
            <div className="text-center pb-2">
              <h2 className="text-lg font-bold text-neutral-900">Student & Parent Portal</h2>
              <p className="text-xs text-neutral-500">
                View your weekly test marks, notes & fee records
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Roll Number or Mobile Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. VMC-101 or 9871100234"
                  value={studentIdentifier}
                  onChange={(e) => setStudentIdentifier(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                />
                <GraduationCap className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Student Password
              </label>
              <div className="relative">
                <input
                  type={showStudentPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter student password"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                />
                <span className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs">
                  *
                </span>
                <button
                  type="button"
                  onClick={() => setShowStudentPassword(!showStudentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 focus:outline-none cursor-pointer"
                  title={showStudentPassword ? 'Hide password' : 'Show password'}
                >
                  {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.01] disabled:opacity-50"
            >
              <GraduationCap className="w-4 h-4" />
              <span>{loading ? 'Logging In...' : 'Open Student Dashboard'}</span>
            </button>

            <div className="pt-2 text-center text-xs text-neutral-500">
              New student?{' '}
              <button
                type="button"
                onClick={() => setActiveTab('enquiry')}
                className="text-indigo-600 hover:underline font-bold cursor-pointer"
              >
                Submit Admission Enquiry
              </button>
            </div>
          </form>
        )}

        {/* ===================== 4. REGISTER TAB ===================== */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="text-center pb-1">
              <h2 className="text-lg font-bold text-neutral-900">New Student Registration</h2>
              <p className="text-xs text-neutral-500">
                Register basic details to enroll at Vanita Math Classes
              </p>
            </div>

            {regSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs animate-fade-in font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{regSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Student Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diya Singhal"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Class / Grade <span className="text-rose-500">*</span>
                </label>
                <select
                  value={regGrade}
                  onChange={(e) => setRegGrade(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  <option value="8th Class">Class 8th Mathematics</option>
                  <option value="9th Class">Class 9th Mathematics</option>
                  <option value="10th Class">Class 10th Mathematics</option>
                  <option value="+1 (11th) Mathematics">+1 (11th) Mathematics</option>
                  <option value="+2 (12th) Mathematics">+2 (12th) Mathematics</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Student Mobile <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-sm text-neutral-900 font-mono placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Parent / Guardian Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Father's / Mother's name"
                  value={regParentName}
                  onChange={(e) => setRegParentName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Parent Phone / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Parent mobile number"
                  value={regParentPhone}
                  onChange={(e) => setRegParentPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-sm text-neutral-900 font-mono placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  School / College Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. DPS, DAV Public School"
                  value={regSchool}
                  onChange={(e) => setRegSchool(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Create Password
              </label>
              <div className="relative">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="Choose password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50"
            >
              <span>{loading ? 'Registering...' : 'Submit Admission & Open Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-1 text-center text-xs text-neutral-500">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setActiveTab('student')}
                className="text-indigo-600 hover:underline font-bold cursor-pointer"
              >
                Log in here
              </button>
            </div>
          </form>
        )}

        {/* Collapsible Login Help Box */}
        {showHelp && (
          <div className="mt-4 p-3.5 bg-neutral-100 border border-neutral-200 rounded-xl text-xs text-neutral-700 animate-fade-in">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-neutral-900">Default Access Information:</span>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="text-neutral-400 hover:text-neutral-700 text-[11px] cursor-pointer"
              >
                Close
              </button>
            </div>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              <strong>Admin:</strong> Username is <code>vikas</code> and default password is{' '}
              <code>vanita</code>.<br />
              <strong>Students:</strong> Log in using your assigned Roll Number (e.g.{' '}
              <code>VMC-101</code>) or phone number with password <code>vanita</code>.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
