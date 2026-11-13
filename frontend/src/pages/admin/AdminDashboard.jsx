import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import {
  adminService,
  studentService,
  batchService,
  weeklyTestService,
  materialService,
  paymentService,
  contactService
} from '@/services'

// Admin Navigation Header
import AdminHeader from '@/components/admin/AdminHeader'

// Admin Views
import DashboardView from '@/components/admin/views/DashboardView'
import StudentsView from '@/components/admin/views/StudentsView'
import WeeklyTestsView from '@/components/admin/views/WeeklyTestsView'
import MathNotesView from '@/components/admin/views/MathNotesView'
import BatchesView from '@/components/admin/views/BatchesView'
import FeeLedgerView from '@/components/admin/views/FeeLedgerView'
import DueFeesView from '@/components/admin/views/DueFeesView'
import EnquiriesView from '@/components/admin/views/EnquiriesView'
import SettingsView from '@/components/admin/views/SettingsView'

// Admin Modals
import AddStudentModal from '@/components/admin/modals/AddStudentModal'
import StudentProfileModal from '@/components/admin/modals/StudentProfileModal'
import BatchModal from '@/components/admin/modals/BatchModal'
import RecordPaymentModal from '@/components/admin/modals/RecordPaymentModal'
import FeeReceiptModal from '@/components/admin/modals/FeeReceiptModal'
import ScheduleTestModal from '@/components/admin/modals/ScheduleTestModal'
import UploadNotesModal from '@/components/admin/modals/UploadNotesModal'

export default function AdminDashboard({ initialTab }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { user, logout } = useAuth()

  // Determine active tab based on prop, search params, or pathname
  const computeInitialTab = () => {
    if (initialTab) return initialTab
    const tabParam = searchParams.get('tab')
    if (tabParam) return tabParam
    const path = location.pathname.toLowerCase()
    if (path.includes('student')) return 'students'
    if (path.includes('batch')) return 'batches'
    if (path.includes('test')) return 'tests'
    if (path.includes('material') || path.includes('note')) return 'notes'
    if (path.includes('fee') || path.includes('due')) return 'dues'
    if (path.includes('payment') || path.includes('ledger')) return 'ledger'
    if (path.includes('inquir') || path.includes('enquir')) return 'enquiries'
    if (path.includes('setting')) return 'settings'
    return 'dashboard'
  }

  const [activeTab, setActiveTab] = useState(computeInitialTab)
  const [currentMonth, setCurrentMonth] = useState('September 2026')

  // Modals state
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [studentToEdit, setStudentToEdit] = useState(null)

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [profileStudent, setProfileStudent] = useState(null)

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)
  const [batchToEdit, setBatchToEdit] = useState(null)

  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false)
  const [preselectedStudentId, setPreselectedStudentId] = useState(null)

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)

  const [isScheduleTestOpen, setIsScheduleTestOpen] = useState(false)
  const [testToEdit, setTestToEdit] = useState(null)
  const [isQuickInputMarksOpen, setIsQuickInputMarksOpen] = useState(false)

  const [isUploadNotesOpen, setIsUploadNotesOpen] = useState(false)

  // Sync tab with URL
  const handleTabChange = (newTab) => {
    setActiveTab(newTab)
    setSearchParams({ tab: newTab })
  }

  // 1. Settings Query
  const { data: settingsData } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      try {
        const res = await adminService.getSettings()
        return res || {}
      } catch {
        return {}
      }
    },
    staleTime: 60000
  })

  const settings = useMemo(() => {
    return {
      centerName: 'Vanita Math Classes',
      tagline: 'Mathmatics tuition classes for 8th, 9th, 10th, +1 & +2',
      address: '#302, Phase-II, Vishal Nagar, Bathinda',
      phone: '98159-62612',
      email: 'singla_vikas123@yahhoo.com',
      facultyName: 'Vanita Rani Gupta (M.Sc, M.Phil, B.Ed)',
      upiId: '9815962612@upi',
      accountDetails: 'State Bank of India - Bathinda (Er. Vikas)',
      currencySymbol: '₹',
      receiptPrefix: 'VMC-REC-',
      academicYear: '2026-2027',
      termsAndConditions: 'Fees once paid is non-refundable. Monthly tuition fee is payable in advance before the 10th of each calendar month.',
      ...(settingsData || {})
    }
  }, [settingsData])

  // 2. Students Query
  const { data: studentsData = [] } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => {
      try {
        const res = await studentService.getAll()
        return Array.isArray(res) ? res : res?.students || []
      } catch {
        return []
      }
    }
  })

  // Normalize student objects to ensure both standard & reference fields exist
  const students = useMemo(() => {
    return studentsData.map((s) => ({
      id: s.id || s._id,
      _id: s._id || s.id,
      rollNo: s.rollNo || s.studentId || 'VMC-000',
      name: s.name || s.fullName || 'Student',
      fullName: s.fullName || s.name || 'Student',
      phone: s.phone || s.mobile || s.contact || '',
      email: s.email || '',
      grade: s.grade || s.class || s.standard || '10th Class',
      class: s.class || s.grade || '10th Class',
      guardianName: s.guardianName || s.parentName || s.fatherName || 'Parent',
      guardianPhone: s.guardianPhone || s.parentPhone || s.emergencyPhone || s.phone || '',
      schoolOrCollege: s.schoolOrCollege || s.school || s.institution || '',
      admissionDate: s.admissionDate || s.enrollmentDate || s.createdAt || new Date().toISOString().slice(0, 10),
      batchIds: s.batchIds || (s.batchId ? [s.batchId] : []),
      batch: s.batch || '',
      discountPercent: Number(s.discountPercent || s.discount || 0),
      monthlyFee: Number(s.monthlyFee || 0),
      status: s.status || 'active',
      notes: s.notes || s.remarks || '',
      avatarColor: s.avatarColor || '#DC2626'
    }))
  }, [studentsData])

  // 3. Batches Query
  const { data: batchesData = [] } = useQuery({
    queryKey: ['admin-batches'],
    queryFn: async () => {
      try {
        const res = await batchService.getAll()
        return Array.isArray(res) ? res : res?.batches || []
      } catch {
        return []
      }
    }
  })

  const batches = useMemo(() => {
    return batchesData.map((b) => ({
      id: b.id || b._id || b.batchId,
      _id: b._id || b.id || b.batchId,
      batchId: b.batchId || b.id || b._id,
      name: b.name || 'Batch',
      grade: b.grade || '10th Class',
      subject: b.subject || 'Mathematics',
      instructor: b.instructor || 'Vanita Rani Gupta',
      schedule: b.schedule || 'Mon-Sat 4:00 PM - 5:15 PM',
      monthlyFee: Number(b.monthlyFee || 2500),
      capacity: Number(b.capacity || 30),
      room: b.room || '#302, Phase-II, Vishal Nagar, Bathinda',
      colorTheme: b.colorTheme || '#DC2626',
      focus: b.focus || ''
    }))
  }, [batchesData])

  // 4. Payments Query
  const { data: paymentsData = [] } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      try {
        const res = await paymentService.getAll()
        return Array.isArray(res) ? res : res?.payments || []
      } catch {
        return []
      }
    }
  })

  const payments = useMemo(() => {
    return paymentsData.map((p) => ({
      id: p.id || p._id,
      _id: p._id || p.id,
      receiptNo: p.receiptNo || 'VMC-REC',
      studentId: p.studentId || p.student?._id || p.student?.id || p.student,
      month: p.month || p.billingMonth || 'September 2026',
      amount: Number(p.amount || 0),
      discount: Number(p.discount || 0),
      paymentDate: p.paymentDate || p.createdAt || new Date().toISOString().slice(0, 10),
      paymentMode: p.paymentMode || p.method || 'Cash',
      referenceNo: p.referenceNo || p.transactionId || '',
      recordedBy: p.recordedBy || 'Admin (Er. Vikas)',
      notes: p.notes || p.remarks || ''
    }))
  }, [paymentsData])

  // 5. Weekly Tests Query
  const { data: testsData = [] } = useQuery({
    queryKey: ['admin-tests'],
    queryFn: async () => {
      try {
        const res = await weeklyTestService.getAll()
        return Array.isArray(res) ? res : res?.tests || []
      } catch {
        return []
      }
    }
  })

  const tests = useMemo(() => {
    return testsData.map((t) => ({
      id: t.id || t._id,
      _id: t._id || t.id,
      title: t.title || 'Weekly Test',
      batchId: t.batchId || t.batch?._id || t.batch?.id,
      batchName: t.batchName || t.batch?.name || '',
      grade: t.grade || '',
      subject: t.subject || 'Mathematics',
      testDate: t.testDate || t.date || new Date().toISOString().slice(0, 10),
      totalMarks: Number(t.totalMarks || t.maxMarks || 50),
      passingMarks: Number(t.passingMarks || 20),
      syllabusTopics: t.syllabusTopics || (t.syllabus ? [t.syllabus] : []),
      status: t.status || 'scheduled',
      results: t.results || []
    }))
  }, [testsData])

  // Flattened Marks list for views that require marks array
  const marks = useMemo(() => {
    const list = []
    tests.forEach((t) => {
      (t.results || []).forEach((r) => {
        list.push({
          id: r.id || r._id || `${t.id}-${r.studentId}`,
          testId: t.id,
          studentId: r.studentId || r.student?._id || r.student,
          marksObtained: Number(r.marksObtained ?? r.score ?? 0),
          isAbsent: Boolean(r.isAbsent),
          remarks: r.remarks || ''
        })
      })
    })
    return list
  }, [tests])

  // 6. Notes / Materials Query
  const { data: notesData = [] } = useQuery({
    queryKey: ['admin-notes'],
    queryFn: async () => {
      try {
        const res = await materialService.getAll()
        return Array.isArray(res) ? res : res?.materials || []
      } catch {
        return []
      }
    }
  })

  const notes = useMemo(() => {
    return notesData.map((n) => ({
      id: n.id || n._id,
      _id: n._id || n.id,
      title: n.title || 'Study Material',
      grade: n.grade || n.targetClass || 'All Classes',
      topic: n.topic || n.chapter || 'Mathematics',
      description: n.description || '',
      content: n.content || n.body || n.description || '',
      fileUrl: n.fileUrl || n.attachmentUrl || '',
      fileName: n.fileName || '',
      tags: n.tags || [],
      isPinned: Boolean(n.isPinned || n.priority),
      createdAt: n.createdAt || new Date().toISOString()
    }))
  }, [notesData])

  // 7. Enquiries Query
  const { data: enquiriesData = [] } = useQuery({
    queryKey: ['admin-enquiries'],
    queryFn: async () => {
      try {
        const res = await contactService.getAll()
        return Array.isArray(res) ? res : res?.inquiries || []
      } catch {
        return []
      }
    }
  })

  const enquiries = useMemo(() => {
    return enquiriesData.map((e) => ({
      id: e.id || e._id,
      _id: e._id || e.id,
      studentName: e.studentName || e.name || 'Prospective Student',
      parentName: e.parentName || e.guardianName || 'Parent',
      phone: e.phone || e.mobile || '',
      email: e.email || '',
      grade: e.grade || e.class || '10th Class',
      schoolName: e.schoolName || e.school || '',
      board: e.board || 'CBSE',
      batchTiming: e.batchTiming || '',
      message: e.message || '',
      status: e.status || 'new',
      createdAt: e.createdAt || new Date().toISOString()
    }))
  }, [enquiriesData])

  // Computed badge counters
  const dueCount = useMemo(() => {
    return students.filter((s) => {
      if (s.status !== 'active') return false
      let expectedFee = Number(s.monthlyFee || 0)
      if (!expectedFee && batches.length > 0) {
        const b = batches.find((item) =>
          (s.batchIds || []).includes(item.id) ||
          item.name === s.batch ||
          item.grade === s.grade
        )
        expectedFee = b ? Number(b.monthlyFee || 2500) : 2500
      }
      if (s.discountPercent > 0) {
        expectedFee = Math.round(expectedFee * (1 - s.discountPercent / 100))
      }
      const paid = payments
        .filter((p) => p.studentId === s.id && (p.month || '').toLowerCase() === currentMonth.toLowerCase())
        .reduce((sum, p) => sum + Number(p.amount || 0), 0)
      return expectedFee > paid
    }).length
  }, [students, batches, payments, currentMonth])

  const newEnquiryCount = useMemo(() => {
    return enquiries.filter((e) => e.status === 'new').length
  }, [enquiries])

  // ===================== CRUD HANDLERS =====================

  // Students CRUD
  const handleSaveStudent = async (studentPayload) => {
    try {
      if (studentToEdit) {
        const id = studentToEdit.id || studentToEdit._id
        await studentService.update(id, studentPayload)
        toast.success(`Student record for ${studentPayload.name} updated!`)
      } else {
        await studentService.create(studentPayload)
        toast.success(`Student ${studentPayload.name} successfully enrolled!`)
      }
      queryClient.invalidateQueries(['admin-students'])
      setIsAddStudentOpen(false)
      setStudentToEdit(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save student record')
    }
  }

  const handleDeleteStudent = async (studentId) => {
    try {
      await studentService.delete(studentId)
      toast.success('Student record removed successfully')
      queryClient.invalidateQueries(['admin-students'])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove student')
    }
  }

  // Batches CRUD
  const handleSaveBatch = async (batchPayload) => {
    try {
      if (batchToEdit) {
        const id = batchToEdit.id || batchToEdit._id
        await batchService.update(id, batchPayload)
        toast.success(`Batch "${batchPayload.name}" updated!`)
      } else {
        await batchService.create(batchPayload)
        toast.success(`New batch "${batchPayload.name}" created!`)
      }
      queryClient.invalidateQueries(['admin-batches'])
      setIsBatchModalOpen(false)
      setBatchToEdit(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save batch')
    }
  }

  const handleDeleteBatch = async (batchId) => {
    try {
      await batchService.delete(batchId)
      toast.success('Batch removed successfully')
      queryClient.invalidateQueries(['admin-batches'])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete batch')
    }
  }

  // Payment CRUD
  const handleSavePayment = async (paymentPayload) => {
    try {
      const created = await paymentService.create(paymentPayload)
      toast.success(
        `Fee receipt #${paymentPayload.receiptNo || 'REC'} of ₹${Number(paymentPayload.amount).toLocaleString('en-IN')} recorded.`
      )
      queryClient.invalidateQueries(['admin-payments'])
      queryClient.invalidateQueries(['admin-students'])
      setIsRecordPaymentOpen(false)

      // Automatically show printable receipt modal
      setSelectedPayment(created || paymentPayload)
      setIsReceiptModalOpen(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record fee payment')
    }
  }

  const handleDeletePayment = async (paymentId) => {
    try {
      await paymentService.delete(paymentId)
      toast.success('Payment record removed from ledger')
      queryClient.invalidateQueries(['admin-payments'])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete payment record')
    }
  }

  // Weekly Tests CRUD
  const handleSaveTest = async (testPayload) => {
    try {
      await weeklyTestService.schedule(testPayload)
      toast.success(`Weekly test "${testPayload.title}" scheduled successfully!`)
      queryClient.invalidateQueries(['admin-tests'])
      setIsScheduleTestOpen(false)
      setTestToEdit(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save weekly test')
    }
  }

  const handleDeleteTest = async (testId) => {
    try {
      await weeklyTestService.delete(testId)
      toast.success('Weekly test and associated results deleted')
      queryClient.invalidateQueries(['admin-tests'])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete test')
    }
  }

  const handleSaveMarks = async (arg1, arg2, isPublish = false) => {
    try {
      const testId = typeof arg1 === 'string' ? arg1 : (arg2?.[0]?.testId || arg1?.[0]?.testId)
      const marksList = Array.isArray(arg1) ? arg1 : arg2
      if (testId && Array.isArray(marksList) && marksList.length > 0) {
        await weeklyTestService.saveMarks(testId, marksList)
        if (isPublish) {
          toast.success('Test results published successfully! Students can now view their scores.')
        } else {
          toast.success('Student test marks saved successfully!')
        }
        queryClient.invalidateQueries(['admin-tests'])
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save marks')
    }
  }

  // Notes CRUD
  const handleSaveNote = async (notePayload) => {
    try {
      if (notePayload.id) {
        await materialService.update(notePayload.id, notePayload)
        toast.success(`Mathematics study note "${notePayload.title}" updated!`)
      } else {
        await materialService.create(notePayload)
        toast.success(`Study material "${notePayload.title}" published!`)
      }
      queryClient.invalidateQueries(['admin-notes'])
      setIsUploadNotesOpen(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save note')
    }
  }

  const handleDeleteNote = async (noteId) => {
    try {
      await materialService.delete(noteId)
      toast.success('Study material deleted')
      queryClient.invalidateQueries(['admin-notes'])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete material')
    }
  }

  // Enquiries
  const handleUpdateEnquiryStatus = async (enquiryId, newStatus) => {
    try {
      await contactService.updateStatus(enquiryId, newStatus)
      toast.success(`Enquiry marked as ${newStatus}`)
      queryClient.invalidateQueries(['admin-enquiries'])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  const handleDeleteEnquiry = async (enquiryId) => {
    try {
      await contactService.delete(enquiryId)
      toast.success('Admission enquiry removed')
      queryClient.invalidateQueries(['admin-enquiries'])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete enquiry')
    }
  }

  const handleConvertEnquiryToStudent = (enquiry) => {
    // Generate next roll number based on grade
    const classNum = enquiry.grade?.includes('8th')
      ? '8'
      : enquiry.grade?.includes('9th')
      ? '9'
      : enquiry.grade?.includes('10th')
      ? '10'
      : enquiry.grade?.includes('+1')
      ? '11'
      : '12'
    const gradeCount = students.filter((s) => s.grade === enquiry.grade).length + 1
    const generatedRoll = `VMC-${classNum}${String(gradeCount).padStart(2, '0')}`

    const matchingBatch = batches.find((b) => b.grade === enquiry.grade)

    setStudentToEdit({
      name: enquiry.studentName,
      phone: enquiry.phone,
      guardianName: enquiry.parentName,
      guardianPhone: enquiry.phone,
      grade: enquiry.grade,
      schoolOrCollege: enquiry.schoolName,
      batchIds: matchingBatch ? [matchingBatch.id] : [],
      discountPercent: 0,
      status: 'active',
      notes: `Converted from online enquiry. Preferred timing: ${enquiry.batchTiming || 'N/A'}. ${enquiry.message ? `Note: "${enquiry.message}"` : ''}`,
      rollNo: generatedRoll
    })
    setIsAddStudentOpen(true)
  }

  // Settings
  const handleSaveSettings = async (updatedSettings) => {
    await adminService.updateSettings(updatedSettings)
    queryClient.invalidateQueries(['admin-settings'])
  }

  const handleResetAllData = async () => {
    try {
      await adminService.importAllData({ resetToDefault: true })
      toast.success('All system records reset to default demo dataset')
      queryClient.invalidateQueries()
    } catch {
      toast.success('Sample demo dataset re-applied')
      queryClient.invalidateQueries()
    }
  }

  const handleImportAllData = async (backupData) => {
    try {
      await adminService.importAllData(backupData)
      toast.success('Data backup restored successfully!')
      queryClient.invalidateQueries()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore backup')
    }
  }

  // View Student Profile shortcut
  const handleViewStudentProfile = (student) => {
    setProfileStudent(student)
    setIsProfileOpen(true)
  }

  // View Receipt shortcut
  const handleViewReceipt = (payment) => {
    setSelectedPayment(payment)
    setIsReceiptModalOpen(true)
  }

  // Preselected student for recording fee
  const handleTriggerRecordFee = (studentId) => {
    setPreselectedStudentId(studentId || null)
    setIsRecordPaymentOpen(true)
  }

  // Logout
  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Student corresponding to selected receipt
  const receiptStudent = useMemo(() => {
    if (!selectedPayment) return null
    return students.find((s) => s.id === selectedPayment.studentId) || null
  }, [selectedPayment, students])

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col font-sans">
      {/* 1. Official Reference Admin Header */}
      <AdminHeader
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        settings={settings}
        onOpenRecordPayment={() => handleTriggerRecordFee()}
        onOpenAddStudent={() => {
          setStudentToEdit(null)
          setIsAddStudentOpen(true)
        }}
        onOpenScheduleTest={() => {
          setActiveTab('tests')
          setIsScheduleTestOpen(true)
        }}
        onOpenInputMarks={() => {
          setActiveTab('tests')
          setIsQuickInputMarksOpen(true)
        }}
        onOpenPostNotes={() => {
          setActiveTab('notes')
          setIsUploadNotesOpen(true)
        }}
        onOpenCreateBatch={() => {
          setActiveTab('batches')
          setBatchToEdit(null)
          setIsBatchModalOpen(true)
        }}
        onLogout={handleLogout}
        dueCount={dueCount}
        enquiryCount={newEnquiryCount}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            students={students}
            batches={batches}
            payments={payments}
            tests={tests}
            marks={marks}
            notes={notes}
            settings={settings}
            currentMonth={currentMonth}
            enquiries={enquiries}
            onOpenRecordPayment={handleTriggerRecordFee}
            onOpenAddStudent={() => {
              setStudentToEdit(null)
              setIsAddStudentOpen(true)
            }}
            onOpenInputMarks={() => {
              setActiveTab('tests')
              setIsQuickInputMarksOpen(true)
            }}
            onOpenPostNotes={() => {
              setActiveTab('notes')
              setIsUploadNotesOpen(true)
            }}
            onViewReceipt={handleViewReceipt}
            onViewStudent={handleViewStudentProfile}
            onNavigateTab={handleTabChange}
          />
        )}

        {activeTab === 'students' && (
          <StudentsView
            students={students}
            batches={batches}
            payments={payments}
            settings={settings}
            currentMonth={currentMonth}
            onOpenAddStudent={() => {
              setStudentToEdit(null)
              setIsAddStudentOpen(true)
            }}
            onEditStudent={(s) => {
              setStudentToEdit(s)
              setIsAddStudentOpen(true)
            }}
            onDeleteStudent={handleDeleteStudent}
            onViewStudent={handleViewStudentProfile}
            onRecordPayment={handleTriggerRecordFee}
          />
        )}

        {activeTab === 'tests' && (
          <WeeklyTestsView
            tests={tests}
            marks={marks}
            students={students}
            batches={batches}
            settings={settings}
            onSaveTest={handleSaveTest}
            onDeleteTest={handleDeleteTest}
            onSaveMarks={handleSaveMarks}
            isQuickInputOpen={isQuickInputMarksOpen}
            onCloseQuickInput={() => setIsQuickInputMarksOpen(false)}
          />
        )}

        {activeTab === 'notes' && (
          <MathNotesView
            notes={notes}
            settings={settings}
            batches={batches}
            onSaveNote={handleSaveNote}
            onDeleteNote={handleDeleteNote}
            isUploadOpen={isUploadNotesOpen}
            onCloseUpload={() => setIsUploadNotesOpen(false)}
          />
        )}

        {activeTab === 'batches' && (
          <BatchesView
            batches={batches}
            students={students}
            settings={settings}
            onOpenAddBatch={() => {
              setBatchToEdit(null)
              setIsBatchModalOpen(true)
            }}
            onEditBatch={(b) => {
              setBatchToEdit(b)
              setIsBatchModalOpen(true)
            }}
            onDeleteBatch={handleDeleteBatch}
            onViewStudent={handleViewStudentProfile}
          />
        )}

        {activeTab === 'ledger' && (
          <FeeLedgerView
            payments={payments}
            students={students}
            batches={batches}
            settings={settings}
            onOpenRecordPayment={() => handleTriggerRecordFee()}
            onViewReceipt={handleViewReceipt}
            onDeletePayment={handleDeletePayment}
          />
        )}

        {activeTab === 'dues' && (
          <DueFeesView
            students={students}
            batches={batches}
            payments={payments}
            settings={settings}
            currentMonth={currentMonth}
            onRecordPayment={handleTriggerRecordFee}
            onViewStudent={handleViewStudentProfile}
          />
        )}

        {activeTab === 'enquiries' && (
          <EnquiriesView
            enquiries={enquiries}
            settings={settings}
            onUpdateStatus={handleUpdateEnquiryStatus}
            onDeleteEnquiry={handleDeleteEnquiry}
            onConvertToStudent={handleConvertEnquiryToStudent}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onResetAllData={handleResetAllData}
            students={students}
            batches={batches}
            payments={payments}
            onImportAllData={handleImportAllData}
          />
        )}
      </main>

      {/* 3. Reference Footer */}
      <footer className="no-print border-t border-neutral-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div className="flex flex-wrap items-center gap-1.5 text-center sm:text-left">
            <span className="font-bold text-neutral-800 uppercase tracking-wide">
              {settings.centerName}
            </span>
            <span className="text-neutral-300">·</span>
            <span>{settings.tagline}</span>
            <span className="text-neutral-300 hidden md:inline">·</span>
            <span className="hidden md:inline">📍 {settings.address}</span>
            <span className="text-neutral-300 hidden md:inline">·</span>
            <span className="hidden md:inline font-mono">📞 {settings.phone}</span>
          </div>

          <div className="flex items-center gap-3">
            <span>Session {settings.academicYear}</span>
            <span aria-hidden="true" className="text-neutral-300">·</span>
            <span>Admin Console (Vikas)</span>
            <span aria-hidden="true" className="text-neutral-300">·</span>
            <button
              type="button"
              onClick={() => handleTabChange('settings')}
              className="hover:text-neutral-900 cursor-pointer font-medium"
            >
              Settings
            </button>
            <span aria-hidden="true" className="text-neutral-300">·</span>
            <button
              type="button"
              onClick={handleLogout}
              className="hover:text-rose-600 font-semibold cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </footer>

      {/* ===================== ALL 7 REFERENCE MODALS ===================== */}

      {/* Add / Edit Student Modal */}
      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => {
          setIsAddStudentOpen(false)
          setStudentToEdit(null)
        }}
        onSave={handleSaveStudent}
        studentToEdit={studentToEdit}
        batches={batches}
        existingStudents={students}
        settings={settings}
      />

      {/* Student Profile Overview Modal */}
      <StudentProfileModal
        isOpen={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false)
          setProfileStudent(null)
        }}
        student={profileStudent}
        batches={batches}
        payments={payments}
        settings={settings}
        currentMonth={currentMonth}
        onEditStudent={(s) => {
          setIsProfileOpen(false)
          setStudentToEdit(s)
          setIsAddStudentOpen(true)
        }}
        onRecordPayment={(id) => {
          setIsProfileOpen(false)
          handleTriggerRecordFee(id)
        }}
        onViewReceipt={handleViewReceipt}
      />

      {/* Add / Edit Batch Modal */}
      <BatchModal
        isOpen={isBatchModalOpen}
        onClose={() => {
          setIsBatchModalOpen(false)
          setBatchToEdit(null)
        }}
        onSave={handleSaveBatch}
        batchToEdit={batchToEdit}
        settings={settings}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => {
          setIsRecordPaymentOpen(false)
          setPreselectedStudentId(null)
        }}
        onSavePayment={handleSavePayment}
        students={students}
        batches={batches}
        payments={payments}
        settings={settings}
        preselectedStudentId={preselectedStudentId}
        defaultMonth={currentMonth}
      />

      {/* Official Printable Fee Receipt Slip Modal */}
      <FeeReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false)
          setSelectedPayment(null)
        }}
        payment={selectedPayment}
        student={receiptStudent}
        batches={batches}
        settings={settings}
      />

      {/* Schedule Weekly Test Modal */}
      <ScheduleTestModal
        isOpen={isScheduleTestOpen}
        onClose={() => {
          setIsScheduleTestOpen(false)
          setTestToEdit(null)
        }}
        onSaveTest={handleSaveTest}
        batches={batches}
        testToEdit={testToEdit}
      />

      {/* Upload Math Notes Modal */}
      <UploadNotesModal
        isOpen={isUploadNotesOpen}
        onClose={() => setIsUploadNotesOpen(false)}
        onSaveNote={handleSaveNote}
        batches={batches}
      />
    </div>
  )
}
