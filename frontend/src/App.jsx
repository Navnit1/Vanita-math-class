import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/shared/ProtectedRoute'
import { PageLoader } from '@/components/ui'

const LandingPage = lazy(() => import('@/pages/landing/LandingPage'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const AdminLoginPage = lazy(() => import('@/pages/auth/AdminLoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const SetNewPasswordPage = lazy(() => import('@/pages/auth/SetNewPasswordPage'))

// Admin pages
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const Inquiries = lazy(() => import('@/pages/admin/Inquiries'))
const ManageStudents = lazy(() => import('@/pages/admin/ManageStudents'))
const TestReportsAdmin = lazy(() => import('@/pages/admin/TestReportsAdmin'))
const FeeManagement = lazy(() => import('@/pages/admin/FeeManagement'))
const PaymentManagement = lazy(() => import('@/pages/admin/PaymentManagement'))
const AttendanceManager = lazy(() => import('@/pages/admin/AttendanceManager'))
const AnnouncementsAdmin = lazy(() => import('@/pages/admin/AnnouncementsAdmin'))
const MaterialsAdmin = lazy(() => import('@/pages/admin/MaterialsAdmin'))
const Reports = lazy(() => import('@/pages/admin/Reports'))
const AdminSettings = lazy(() => import('@/pages/admin/Settings'))

// Student pages
const StudentDashboard = lazy(() => import('@/pages/student/StudentDashboard'))
const StudentTestReports = lazy(() => import('@/pages/student/StudentTestReports'))
const StudentFees = lazy(() => import('@/pages/student/StudentFees'))
const StudentPayments = lazy(() => import('@/pages/student/StudentPayments'))
const StudentAttendance = lazy(() => import('@/pages/student/StudentAttendance'))
const StudentNotices = lazy(() => import('@/pages/student/StudentNotices'))
const StudentMaterials = lazy(() => import('@/pages/student/StudentMaterials'))
const StudentProfile = lazy(() => import('@/pages/student/StudentProfile'))
const StudentSettings = lazy(() => import('@/pages/student/StudentSettings'))

const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public landing website */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth routes */}
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/admin-login" element={<PublicOnlyRoute><AdminLoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
        <Route path="/set-new-password" element={<ProtectedRoute><SetNewPasswordPage /></ProtectedRoute>} />

        {/* Protected Admin routes */}
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/inquiries" element={<ProtectedRoute roles={['admin']}><Inquiries /></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute roles={['admin']}><ManageStudents /></ProtectedRoute>} />
        <Route path="/admin/test-reports" element={<ProtectedRoute roles={['admin']}><TestReportsAdmin /></ProtectedRoute>} />
        <Route path="/admin/fees" element={<ProtectedRoute roles={['admin']}><FeeManagement /></ProtectedRoute>} />
        <Route path="/admin/payments" element={<ProtectedRoute roles={['admin']}><PaymentManagement /></ProtectedRoute>} />
        <Route path="/admin/materials" element={<ProtectedRoute roles={['admin']}><MaterialsAdmin /></ProtectedRoute>} />
        <Route path="/admin/attendance" element={<ProtectedRoute roles={['admin']}><AttendanceManager /></ProtectedRoute>} />
        <Route path="/admin/announcements" element={<ProtectedRoute roles={['admin']}><AnnouncementsAdmin /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><Reports /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute roles={['admin']}><AdminSettings /></ProtectedRoute>} />

        {/* Protected Student routes */}
        <Route path="/dashboard" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/test-reports" element={<ProtectedRoute roles={['student']}><StudentTestReports /></ProtectedRoute>} />
        <Route path="/dashboard/fees" element={<ProtectedRoute roles={['student']}><StudentFees /></ProtectedRoute>} />
        <Route path="/dashboard/payments" element={<ProtectedRoute roles={['student']}><StudentPayments /></ProtectedRoute>} />
        <Route path="/dashboard/materials" element={<ProtectedRoute roles={['student']}><StudentMaterials /></ProtectedRoute>} />
        <Route path="/dashboard/attendance" element={<ProtectedRoute roles={['student']}><StudentAttendance /></ProtectedRoute>} />
        <Route path="/dashboard/notices" element={<ProtectedRoute roles={['student']}><StudentNotices /></ProtectedRoute>} />
        <Route path="/dashboard/profile" element={<ProtectedRoute roles={['student']}><StudentProfile /></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute roles={['student']}><StudentSettings /></ProtectedRoute>} />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
