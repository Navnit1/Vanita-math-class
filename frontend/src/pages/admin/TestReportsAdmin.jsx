import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, Modal, ConfirmDialog, FormField, Select, EmptyState, Badge } from '@/components/ui'
import { weeklyTestService } from '@/services'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import {
  ClipboardCheck, Calendar, Plus, PenTool, CheckCircle2,
  AlertCircle, Trash2, Clock, BookOpen, Users, Award, Check, X,
  Save, Search, Sparkles, Send, ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'

const CLASSES = ['8th', '9th', '10th', '+1', '+2']
const BATCHES = ['All Batches', 'Evening', 'Morning', 'Weekend']

export default function TestReportsAdmin() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'schedule' ? 'schedule' : 'marks'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [selectedTestId, setSelectedTestId] = useState(searchParams.get('testId') || '')
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null)

  // Schedule Test Form State
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    class: '10th',
    batch: 'All Batches',
    testDate: new Date().toISOString().slice(0, 10),
    startTime: '10:00 AM',
    endTime: '11:30 AM',
    durationMinutes: 90,
    subject: 'Mathematics',
    topicsCovered: '',
    maxMarks: 50,
    passingMarks: 20,
    instructions: 'Bring your geometry instruments and blue/black pens. Calculators not permitted.',
    announcementText: '',
    notifyWhatsApp: true,
  })

  // Marks Spreadsheet State
  const [marksSheet, setMarksSheet] = useState([])
  const [sheetSearch, setSheetSearch] = useState('')
  const [isDirty, setIsDirty] = useState(false)

  const qc = useQueryClient()

  // 1. Fetch all created weekly tests
  const { data: testsData, isLoading: testsLoading } = useQuery({
    queryKey: ['weekly-tests'],
    queryFn: () => weeklyTestService.getAll({ limit: 100 }),
  })
  const tests = testsData?.tests || []

  // Auto-select latest test if none selected
  useEffect(() => {
    if (!selectedTestId && tests.length > 0) {
      setSelectedTestId(tests[0]._id)
    }
  }, [tests, selectedTestId])

  // 2. Fetch test sheet when selectedTestId changes
  const { data: sheetData, isLoading: sheetLoading, refetch: refetchSheet } = useQuery({
    queryKey: ['weekly-test-sheet', selectedTestId],
    queryFn: () => weeklyTestService.getSheet(selectedTestId),
    enabled: Boolean(selectedTestId && activeTab === 'marks'),
  })

  // Synchronize loaded sheet into editable local state
  useEffect(() => {
    if (sheetData?.rows) {
      setMarksSheet(sheetData.rows.map(r => ({ ...r })))
      setIsDirty(false)
    }
  }, [sheetData])

  // Mutations
  const scheduleMutation = useMutation({
    mutationFn: weeklyTestService.schedule,
    onSuccess: (res) => {
      qc.invalidateQueries(['weekly-tests'])
      qc.invalidateQueries(['admin-dashboard'])
      toast.success('Weekly test scheduled and announced to students!')
      // Reset form and switch to marks tab
      setSelectedTestId(res.data._id)
      setActiveTab('marks')
      setScheduleForm({
        title: '',
        class: '10th',
        batch: 'All Batches',
        testDate: new Date().toISOString().slice(0, 10),
        startTime: '10:00 AM',
        endTime: '11:30 AM',
        durationMinutes: 90,
        subject: 'Mathematics',
        topicsCovered: '',
        maxMarks: 50,
        passingMarks: 20,
        instructions: 'Bring your geometry instruments and blue/black pens.',
        announcementText: '',
        notifyWhatsApp: true,
      })
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to schedule test'),
  })

  const saveMarksMutation = useMutation({
    mutationFn: ({ testId, marksList }) => weeklyTestService.saveMarks(testId, marksList),
    onSuccess: (res) => {
      qc.invalidateQueries(['weekly-tests'])
      qc.invalidateQueries(['weekly-test-sheet', selectedTestId])
      qc.invalidateQueries(['admin-dashboard'])
      setIsDirty(false)
      toast.success('Test marks spreadsheet saved successfully!')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to save marks'),
  })

  const deleteMutation = useMutation({
    mutationFn: weeklyTestService.delete,
    onSuccess: () => {
      qc.invalidateQueries(['weekly-tests'])
      qc.invalidateQueries(['admin-dashboard'])
      setDeleteConfirmTarget(null)
      setSelectedTestId('')
      toast.success('Weekly test deleted.')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to delete test'),
  })

  // Handle Schedule Form Submit
  const handleScheduleSubmit = (e) => {
    e.preventDefault()
    if (!scheduleForm.title.trim()) {
      toast.error('Test title is required')
      return
    }
    if (!scheduleForm.topicsCovered.trim()) {
      toast.error('Topics covered is required')
      return
    }
    if (Number(scheduleForm.passingMarks) > Number(scheduleForm.maxMarks)) {
      toast.error('Passing marks cannot exceed maximum marks!')
      return
    }
    scheduleMutation.mutate(scheduleForm)
  }

  // Handle Attendance Toggle
  const toggleAttendance = (index, status) => {
    setMarksSheet(prev => {
      const updated = [...prev]
      const row = { ...updated[index] }
      row.attendance = status

      if (status === 'absent') {
        // For absent students: disable marks entry and do NOT invent a zero score!
        row.marksObtained = null
        row.percentage = null
        row.result = 'absent'
      } else {
        // Present: recompute if score was present
        const testMax = row.maxMarks || 50
        const testPass = row.passingMarks || 20
        const m = row.marksObtained != null ? Number(row.marksObtained) : null
        if (m != null) {
          row.percentage = Number(((m / testMax) * 100).toFixed(1))
          row.result = m >= testPass ? 'pass' : 'fail'
        } else {
          row.result = null
        }
      }

      updated[index] = row
      setIsDirty(true)
      return updated
    })
  }

  // Handle Marks Input
  const handleMarksChange = (index, value) => {
    setMarksSheet(prev => {
      const updated = [...prev]
      const row = { ...updated[index] }
      const testMax = row.maxMarks || 50
      const testPass = row.passingMarks || 20

      if (value === '') {
        row.marksObtained = null
        row.percentage = null
        row.result = null
      } else {
        const num = Math.min(testMax, Math.max(0, Number(value)))
        row.marksObtained = num
        row.percentage = Number(((num / testMax) * 100).toFixed(1))
        row.result = num >= testPass ? 'pass' : 'fail'
      }

      updated[index] = row
      setIsDirty(true)
      return updated
    })
  }

  // Handle Remark Input
  const handleRemarkChange = (index, remark) => {
    setMarksSheet(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], remarks: remark }
      setIsDirty(true)
      return updated
    })
  }

  // Handle Bulk Marks Save
  const handleSaveMarks = () => {
    if (!selectedTestId) return
    const marksPayload = marksSheet.map(r => ({
      studentId: r.studentId,
      attendance: r.attendance,
      marksObtained: r.attendance === 'absent' ? null : r.marksObtained,
      remarks: r.remarks,
    }))
    saveMarksMutation.mutate({ testId: selectedTestId, marksList: marksPayload })
  }

  // Calculate live summary from local marksSheet
  const presentRows = marksSheet.filter(r => r.attendance === 'present')
  const absentRows = marksSheet.filter(r => r.attendance === 'absent')
  const gradedRows = presentRows.filter(r => r.marksObtained != null)
  const passRows = presentRows.filter(r => r.result === 'pass')
  const failRows = presentRows.filter(r => r.result === 'fail')

  const totalScore = gradedRows.reduce((acc, r) => acc + (r.marksObtained || 0), 0)
  const avgScore = gradedRows.length > 0 ? Number((totalScore / gradedRows.length).toFixed(1)) : 0
  const highestScore = gradedRows.length > 0 ? Math.max(...gradedRows.map(r => r.marksObtained || 0)) : 0

  const filteredSheet = marksSheet.filter(r => {
    if (!sheetSearch) return true
    const q = sheetSearch.toLowerCase()
    return (
      r.studentName?.toLowerCase().includes(q) ||
      r.rollNumber?.toLowerCase().includes(q) ||
      r.batch?.toLowerCase().includes(q)
    )
  })

  const currentTest = sheetData?.test || tests.find(t => t._id === selectedTestId)

  return (
    <Sidebar>
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Weekly Tests & Performance Reports</h1>
          <p className="page-subtitle">
            Schedule syllabus tests, track attendance, enter marks, and publish private student results.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-[#F3F4F6] border border-[#D9DDE3] rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('marks')}
            className={cn(
              'px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center gap-1.5',
              activeTab === 'marks'
                ? 'bg-white text-[#C90019] shadow-xs'
                : 'text-[#64748B] hover:text-[#171717]'
            )}
          >
            <PenTool className="w-4 h-4 text-[#E50914]" />
            Test Report & Marks Entry
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={cn(
              'px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center gap-1.5',
              activeTab === 'schedule'
                ? 'bg-[#E50914] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#171717]'
            )}
          >
            <Plus className="w-4 h-4" />
            Schedule Weekly Test
          </button>
        </div>
      </div>

      {/* TAB 1: SCHEDULE WEEKLY TEST */}
      {activeTab === 'schedule' && (
        <div className="card p-6 sm:p-8 max-w-3xl">
          <div className="mb-6 pb-4 border-b border-[#D9DDE3]">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF5F5] text-[#C90019] border border-[#FFCCD0] mb-2 uppercase">
              Schedule & Auto-Announce
            </span>
            <h2 className="text-xl font-extrabold text-[#171717]">Schedule New Weekly Test</h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              On creation, this test will automatically appear in student portals for the selected class/batch and populate the marks-entry spreadsheet.
            </p>
          </div>

          <form onSubmit={handleScheduleSubmit} className="space-y-4">
            <FormField label="Test Title" required hint="e.g. Weekly Test 4: Trigonometric Identities">
              <input
                type="text"
                value={scheduleForm.title}
                onChange={e => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                placeholder="e.g. Chapter 8: Trigonometry Test"
                className="input"
                required
                autoFocus
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Class / Standard" required>
                <Select
                  value={scheduleForm.class}
                  onChange={e => setScheduleForm({ ...scheduleForm, class: e.target.value })}
                >
                  {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                </Select>
              </FormField>

              <FormField label="Applicable Batch" required>
                <Select
                  value={scheduleForm.batch}
                  onChange={e => setScheduleForm({ ...scheduleForm, batch: e.target.value })}
                >
                  {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </Select>
              </FormField>

              <FormField label="Subject" required>
                <input
                  type="text"
                  value={scheduleForm.subject}
                  onChange={e => setScheduleForm({ ...scheduleForm, subject: e.target.value })}
                  className="input"
                  required
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Test Date" required>
                <input
                  type="date"
                  value={scheduleForm.testDate}
                  onChange={e => setScheduleForm({ ...scheduleForm, testDate: e.target.value })}
                  className="input"
                  required
                />
              </FormField>

              <FormField label="Start Time" required>
                <input
                  type="text"
                  value={scheduleForm.startTime}
                  onChange={e => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                  placeholder="e.g. 10:00 AM"
                  className="input"
                  required
                />
              </FormField>

              <FormField label="Duration / End Time" hint="e.g. 90 mins or 11:30 AM">
                <input
                  type="text"
                  value={scheduleForm.endTime}
                  onChange={e => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                  placeholder="e.g. 11:30 AM"
                  className="input"
                />
              </FormField>
            </div>

            <FormField label="Topics Covered" required hint="Syllabus chapters, theorem names, or exercise numbers">
              <input
                type="text"
                value={scheduleForm.topicsCovered}
                onChange={e => setScheduleForm({ ...scheduleForm, topicsCovered: e.target.value })}
                placeholder="e.g. Sin/Cos identities, Heights & Distances, Exercise 8.4"
                className="input"
                required
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Maximum Marks" required>
                <input
                  type="number"
                  min="1"
                  value={scheduleForm.maxMarks}
                  onChange={e => setScheduleForm({ ...scheduleForm, maxMarks: Number(e.target.value) })}
                  className="input font-bold"
                  required
                />
              </FormField>

              <FormField label="Passing Marks" required hint="Passing marks cannot exceed maximum marks">
                <input
                  type="number"
                  min="0"
                  max={scheduleForm.maxMarks}
                  value={scheduleForm.passingMarks}
                  onChange={e => setScheduleForm({ ...scheduleForm, passingMarks: Number(e.target.value) })}
                  className={cn(
                    'input font-bold',
                    Number(scheduleForm.passingMarks) > Number(scheduleForm.maxMarks) && 'input-error text-red-600'
                  )}
                  required
                />
              </FormField>
            </div>

            {Number(scheduleForm.passingMarks) > Number(scheduleForm.maxMarks) && (
              <p className="text-xs text-[#C90019] font-bold">
                ⚠️ Passing marks ({scheduleForm.passingMarks}) cannot exceed Maximum marks ({scheduleForm.maxMarks})!
              </p>
            )}

            <FormField label="Test Instructions" hint="Stationery requirements, negative marking, etc.">
              <textarea
                rows={2}
                value={scheduleForm.instructions}
                onChange={e => setScheduleForm({ ...scheduleForm, instructions: e.target.value })}
                placeholder="Bring geometry box, no mobile phones allowed."
                className="input py-2"
              />
            </FormField>

            <FormField label="Custom Announcement Text (Optional)" hint="Defaults to auto-generated test announcement if left blank">
              <textarea
                rows={2}
                value={scheduleForm.announcementText}
                onChange={e => setScheduleForm({ ...scheduleForm, announcementText: e.target.value })}
                placeholder="Leave blank for automatic notice board announcement"
                className="input py-2"
              />
            </FormField>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="notifyWhatsApp"
                checked={scheduleForm.notifyWhatsApp}
                onChange={e => setScheduleForm({ ...scheduleForm, notifyWhatsApp: e.target.checked })}
                className="rounded border-[#D9DDE3] text-[#E50914] focus:ring-[#E50914]"
              />
              <label htmlFor="notifyWhatsApp" className="text-xs text-[#171717] font-semibold cursor-pointer">
                Dispatch WhatsApp test notification to Class {scheduleForm.class} parents/students
              </label>
            </div>

            <div className="pt-4 border-t border-[#D9DDE3] flex justify-end gap-3">
              <button
                type="submit"
                disabled={scheduleMutation.isPending || Number(scheduleForm.passingMarks) > Number(scheduleForm.maxMarks)}
                className="btn btn-primary py-3 font-bold text-sm tracking-wide shadow-red-glow"
              >
                {scheduleMutation.isPending ? 'Scheduling Test…' : 'Schedule Test & Publish Announcement'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: TEST REPORT & MARKS SPREADSHEET */}
      {activeTab === 'marks' && (
        <div className="space-y-6">
          {/* Test Selector & Controls Card */}
          <div className="card p-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Searchable Test Dropdown */}
              <div className="flex-1 min-w-[280px]">
                <label className="label text-xs uppercase tracking-wider text-[#64748B]">
                  Select Scheduled Weekly Test
                </label>
                {testsLoading ? (
                  <div className="h-10 bg-[#F3F4F6] rounded-lg animate-pulse" />
                ) : tests.length === 0 ? (
                  <p className="text-xs text-[#64748B]">No weekly tests found. Click "Schedule Weekly Test" above.</p>
                ) : (
                  <Select
                    value={selectedTestId}
                    onChange={e => setSelectedTestId(e.target.value)}
                    className="font-bold text-sm text-[#171717]"
                  >
                    {tests.map(t => (
                      <option key={t._id} value={t._id}>
                        {t.title} — Class {t.class} ({t.batch}) — {formatDate(t.testDate)} [{t.status?.toUpperCase()}]
                      </option>
                    ))}
                  </Select>
                )}
              </div>

              {/* Action buttons */}
              {currentTest && (
                <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                  <button
                    onClick={() => setDeleteConfirmTarget(currentTest)}
                    className="btn btn-secondary btn-sm text-[#C90019] hover:bg-red-50"
                    title="Delete this weekly test"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleSaveMarks}
                    disabled={saveMarksMutation.isPending || marksSheet.length === 0}
                    className="btn btn-primary btn-sm flex items-center gap-1.5 font-bold shadow-red-glow"
                  >
                    {saveMarksMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isDirty ? 'Save Marks (Unsaved Changes)' : 'Save / Update Marks'}
                  </button>
                </div>
              )}
            </div>

            {/* Test Metadata Banner */}
            {currentTest && (
              <div className="mt-4 pt-4 border-t border-[#D9DDE3] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[#64748B] block">Target Standard:</span>
                  <span className="font-bold text-[#171717]">Class {currentTest.class} ({currentTest.batch})</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Test Date & Time:</span>
                  <span className="font-bold text-[#171717]">{formatDate(currentTest.testDate)} at {currentTest.startTime}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Max Marks:</span>
                  <span className="font-bold text-[#171717]">{currentTest.maxMarks} Marks</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Passing Marks:</span>
                  <span className="font-bold text-[#059669]">{currentTest.passingMarks} Marks</span>
                </div>
                <div className="col-span-2 sm:col-span-4 bg-[#FAFAFA] border border-[#D9DDE3] rounded-lg p-2.5 mt-1">
                  <span className="font-bold text-[#171717]">Topics: </span>
                  <span className="text-[#64748B]">{currentTest.topicsCovered}</span>
                </div>
              </div>
            )}
          </div>

          {/* LIVE SUMMARY METRICS BAR */}
          {currentTest && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
              <div className="bg-white border border-[#D9DDE3] rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-[#64748B] uppercase block">Expected</span>
                <span className="text-xl font-extrabold text-[#171717]">{marksSheet.length}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Present</span>
                <span className="text-xl font-extrabold text-[#059669]">{presentRows.length}</span>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-red-700 uppercase block">Absent</span>
                <span className="text-xl font-extrabold text-[#C90019]">{absentRows.length}</span>
              </div>
              <div className="bg-white border border-[#D9DDE3] rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-[#64748B] uppercase block">Graded</span>
                <span className="text-xl font-extrabold text-[#171717]">{gradedRows.length}</span>
              </div>
              <div className="bg-[#FFF5F5] border border-[#FFCCD0] rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-[#C90019] uppercase block">Highest</span>
                <span className="text-xl font-extrabold text-[#C90019]">{highestScore}</span>
              </div>
              <div className="bg-white border border-[#D9DDE3] rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-[#64748B] uppercase block">Average</span>
                <span className="text-xl font-extrabold text-[#171717]">{avgScore}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Passed</span>
                <span className="text-xl font-extrabold text-[#059669]">{passRows.length}</span>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-red-700 uppercase block">Failed</span>
                <span className="text-xl font-extrabold text-[#C90019]">{failRows.length}</span>
              </div>
            </div>
          )}

          {/* SPREADSHEET-STYLE MARKS TABLE */}
          {sheetLoading ? (
            <PageLoader />
          ) : !currentTest ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Select or Schedule a Weekly Test"
              description="Please select a weekly test from the dropdown above to load the student spreadsheet."
            />
          ) : marksSheet.length === 0 ? (
            <EmptyState
              icon={Users}
              title={`No active students found in Class ${currentTest.class}`}
              description="Enrolled students in this class will automatically populate this test roster."
            />
          ) : (
            <div className="table-container">
              {/* Search bar inside sheet */}
              <div className="p-3 bg-[#FAFAFA] border-b border-[#D9DDE3] flex items-center justify-between gap-4">
                <div className="w-72">
                  <input
                    type="text"
                    value={sheetSearch}
                    onChange={e => setSheetSearch(e.target.value)}
                    placeholder="Search roster by student name or roll no…"
                    className="input text-xs py-1.5 bg-white"
                  />
                </div>
                {isDirty && (
                  <span className="text-xs font-bold text-[#C90019] flex items-center gap-1 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5" />
                    You have unsaved changes! Click "Save / Update Marks" to persist.
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="w-28">Roll Number</th>
                      <th className="min-w-[160px]">Student Name</th>
                      <th className="w-28">Class / Batch</th>
                      <th className="w-36 text-center">Attendance</th>
                      <th className="w-24 text-center">Max Marks</th>
                      <th className="w-32 text-center">Marks Obtained</th>
                      <th className="w-24 text-center">Percentage</th>
                      <th className="w-24 text-center">Result</th>
                      <th className="min-w-[180px]">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSheet.map((row, idx) => {
                      const isAbsent = row.attendance === 'absent'

                      return (
                        <tr
                          key={row.studentId}
                          className={cn(isAbsent ? 'bg-[#FAFAFA] opacity-75' : 'hover:bg-red-50/20')}
                        >
                          {/* Roll Number */}
                          <td className="font-mono text-xs font-bold text-[#E50914]">
                            {row.rollNumber}
                          </td>

                          {/* Student Name */}
                          <td className="font-bold text-sm text-[#171717]">
                            {row.studentName}
                          </td>

                          {/* Class / Batch */}
                          <td className="text-xs text-[#64748B]">
                            {row.class} · {row.batch}
                          </td>

                          {/* Attendance Controls (Green Present / Red Absent) */}
                          <td className="text-center">
                            <div className="inline-flex rounded-lg border border-[#D9DDE3] p-0.5 bg-white">
                              <button
                                type="button"
                                onClick={() => toggleAttendance(idx, 'present')}
                                className={cn(
                                  'px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1',
                                  !isAbsent
                                    ? 'bg-[#059669] text-white shadow-xs'
                                    : 'text-[#64748B] hover:text-[#171717]'
                                )}
                              >
                                <Check className="w-3 h-3" />
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleAttendance(idx, 'absent')}
                                className={cn(
                                  'px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1',
                                  isAbsent
                                    ? 'bg-[#C90019] text-white shadow-xs'
                                    : 'text-[#64748B] hover:text-[#171717]'
                                )}
                              >
                                <X className="w-3 h-3" />
                                Absent
                              </button>
                            </div>
                          </td>

                          {/* Maximum Marks */}
                          <td className="text-center font-bold text-xs text-[#64748B]">
                            {row.maxMarks}
                          </td>

                          {/* Marks Obtained (Disabled if Absent, NO invented zero!) */}
                          <td className="text-center">
                            {isAbsent ? (
                              <span className="text-xs font-semibold text-[#64748B] italic">
                                — (Absent)
                              </span>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                max={row.maxMarks}
                                value={row.marksObtained != null ? row.marksObtained : ''}
                                onChange={e => handleMarksChange(idx, e.target.value)}
                                placeholder="0"
                                className="input text-center font-bold text-sm w-20 mx-auto py-1.5 focus:border-[#E50914]"
                              />
                            )}
                          </td>

                          {/* Percentage (Live Calculated) */}
                          <td className="text-center">
                            {isAbsent || row.percentage == null ? (
                              <span className="text-xs text-[#64748B]">—</span>
                            ) : (
                              <span className="font-bold text-xs text-[#171717]">
                                {row.percentage}%
                              </span>
                            )}
                          </td>

                          {/* Result Badge (Pass / Fail / Absent) */}
                          <td className="text-center">
                            {isAbsent ? (
                              <Badge variant="red">Absent</Badge>
                            ) : row.result === 'pass' ? (
                              <Badge variant="green">Pass</Badge>
                            ) : row.result === 'fail' ? (
                              <Badge variant="red">Fail</Badge>
                            ) : (
                              <Badge variant="slate">Ungraded</Badge>
                            )}
                          </td>

                          {/* Remark */}
                          <td>
                            <input
                              type="text"
                              value={row.remarks || ''}
                              onChange={e => handleRemarkChange(idx, e.target.value)}
                              placeholder={isAbsent ? 'e.g. Leave applied' : 'e.g. Excellent work, practice Q5'}
                              className="input text-xs py-1"
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Save Bar */}
              <div className="p-4 bg-[#FAFAFA] border-t border-[#D9DDE3] flex items-center justify-between">
                <span className="text-xs text-[#64748B]">
                  Showing {filteredSheet.length} of {marksSheet.length} students enrolled in Class {currentTest?.class}.
                </span>
                <button
                  onClick={handleSaveMarks}
                  disabled={saveMarksMutation.isPending}
                  className="btn btn-primary btn-sm flex items-center gap-1.5 font-bold shadow-red-glow"
                >
                  {saveMarksMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save All Marks
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DELETE TEST CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmTarget)}
        onClose={() => setDeleteConfirmTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteConfirmTarget?._id)}
        title="Delete Weekly Test?"
        message={`Are you sure you want to delete "${deleteConfirmTarget?.title}"? All entered marks and targeted announcements for this test will be permanently removed.`}
        confirmText="Delete Test"
        danger
        loading={deleteMutation.isPending}
      />
    </Sidebar>
  )
}
