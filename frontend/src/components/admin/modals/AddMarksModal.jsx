import { normalizeClassKey } from '@/config/pricing'
import { useState, useEffect, useMemo } from 'react'
import {
  X,
  PenLine,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Users,
  Award,
  Sparkles,
  Send
} from 'lucide-react'
import { formatDate } from '@/utils/formatters'

export default function AddMarksModal({
  isOpen,
  onClose,
  tests = [],
  students = [],
  marks = [],
  settings = {},
  onSaveMarks,
  initialTestId = null,
}) {
  const [selectedStandard, setSelectedStandard] = useState('10th')
  const [selectedSubject, setSelectedSubject] = useState('Mathematics')
  const [selectedTestId, setSelectedTestId] = useState('')
  const [marksState, setMarksState] = useState({})
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Tests matching standard & subject
  const availableTests = useMemo(() => {
    return tests.filter((t) => {
      const tGrade = t.class || t.grade || ''
      const matchesGrade = !selectedStandard || normalizeClassKey(tGrade) === normalizeClassKey(selectedStandard)
      const tSub = (t.subject || 'Mathematics').toLowerCase()
      const matchesSub = !selectedSubject || tSub.includes(selectedSubject.toLowerCase())
      return matchesGrade && matchesSub
    })
  }, [tests, selectedStandard, selectedSubject])

  // Active test being graded
  const activeTest = useMemo(() => {
    return tests.find((t) => (t._id || t.id) === selectedTestId) || availableTests[0] || null
  }, [tests, selectedTestId, availableTests])

  // Students belonging to the selected standard
  const targetStudents = useMemo(() => {
    if (!selectedStandard) return students
    return students.filter((s) => normalizeClassKey(s.class || s.grade) === normalizeClassKey(selectedStandard))
  }, [students, selectedStandard])

  // Initialize selected test when modal opens or standard changes
  useEffect(() => {
    if (initialTestId) {
      setSelectedTestId(initialTestId)
      const t = tests.find((item) => (item._id || item.id) === initialTestId)
      if (t) {
        setSelectedStandard(normalizeClassKey(t.class || t.grade || '10th'))
        setSelectedSubject(t.subject || 'Mathematics')
      }
    } else if (availableTests.length > 0 && !selectedTestId) {
      setSelectedTestId(availableTests[0]._id || availableTests[0].id)
    }
  }, [initialTestId, availableTests, tests, isOpen])

  // Build initial marks state for target students
  useEffect(() => {
    if (!activeTest) {
      setMarksState({})
      return
    }

    const testId = activeTest._id || activeTest.id
    const state = {}

    targetStudents.forEach((s) => {
      const sId = s._id || s.id
      const existing = marks.find(
        (m) =>
          (m.testId?._id || m.testId) === testId &&
          (m.studentId?._id || m.studentId) === sId
      )

      if (existing) {
        state[sId] = {
          marksObtained: existing.marksObtained,
          marksInputRaw: existing.marksObtained != null ? String(existing.marksObtained) : '',
          isPresent: existing.attendance !== 'absent' && existing.isPresent !== false,
          remarks: existing.remarks || '',
        }
      } else {
        state[sId] = {
          marksObtained: '',
          marksInputRaw: '',
          isPresent: true,
          remarks: '',
        }
      }
    })

    setMarksState(state)
    setErrorMsg('')
    setSuccessMsg('')
  }, [activeTest, targetStudents, marks])

  if (!isOpen) return null

  const maxMarks = Number(activeTest?.maxMarks || activeTest?.totalMarks || 50)
  const passingMarks = Number(activeTest?.passingMarks || 20)

  // Handle individual marks input with strict validation
  const handleMarkChange = (studentId, rawValue) => {
    setErrorMsg('')
    if (rawValue === '') {
      setMarksState((prev) => ({
        ...prev,
        [studentId]: { ...prev[studentId], marksInputRaw: '', marksObtained: '' }
      }))
      return
    }

    const num = Number(rawValue)
    if (isNaN(num)) return
    if (num < 0) {
      setErrorMsg('Marks cannot be negative')
      return
    }
    if (num > maxMarks) {
      setErrorMsg(`Marks cannot exceed total marks (${maxMarks})`)
      return
    }

    setMarksState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marksInputRaw: rawValue,
        marksObtained: num
      }
    }))
  }

  // Attendance Toggle
  const toggleAttendance = (studentId) => {
    setMarksState((prev) => {
      const current = prev[studentId]
      const nextPresent = !current?.isPresent
      return {
        ...prev,
        [studentId]: {
          ...current,
          isPresent: nextPresent,
          marksInputRaw: nextPresent ? current?.marksInputRaw || '' : '',
          marksObtained: nextPresent ? current?.marksObtained : null,
        }
      }
    })
  }

  // Quick fill scores
  const handleQuickFillPercentage = (percent) => {
    if (!activeTest) return
    const score = Math.round((maxMarks * percent) / 100)
    setMarksState((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((k) => {
        if (next[k].isPresent) {
          next[k] = { ...next[k], marksObtained: score, marksInputRaw: String(score) }
        }
      })
      return next
    })
  }

  // Save / Publish
  const handleProcessSubmit = (isPublish = false) => {
    if (!activeTest) {
      setErrorMsg('Please select a valid test to grade')
      return
    }

    const testId = activeTest._id || activeTest.id
    const marksList = targetStudents.map((s) => {
      const sId = s._id || s.id
      const entry = marksState[sId] || { marksObtained: '', isPresent: true, remarks: '' }
      const isPresent = entry.isPresent
      const marksObtained = isPresent
        ? (entry.marksObtained !== '' ? Number(entry.marksObtained) : 0)
        : null
      const percentage = isPresent && marksObtained != null
        ? Math.round((marksObtained / maxMarks) * 100)
        : null

      return {
        testId,
        studentId: sId,
        attendance: isPresent ? 'present' : 'absent',
        isPresent,
        marksObtained,
        maxMarks,
        passingMarks,
        percentage,
        result: !isPresent ? 'absent' : marksObtained >= passingMarks ? 'pass' : 'fail',
        remarks: (entry.remarks || '').trim(),
      }
    })

    if (onSaveMarks) {
      onSaveMarks(testId, marksList, isPublish)
    }

    setSuccessMsg(
      isPublish
        ? `Results published successfully for ${activeTest.title}! Notifications broadcasted.`
        : `Draft marks saved successfully for ${activeTest.title}!`
    )

    setTimeout(() => {
      onClose()
    }, 1200)
  }

  // Generate parent WhatsApp report for test score
  const buildWhatsAppResultUrl = (student, markEntry) => {
    const phone = (student.parentPhone || student.guardianPhone || student.phone || '').replace(/[^0-9]/g, '')
    const score = Number(markEntry.marksObtained) || 0
    const pct = Math.round((score / maxMarks) * 100)
    const status = score >= passingMarks ? 'PASS (Qualified)' : 'NEEDS PRACTICE'

    const text = `*${settings.centerName || 'Vanita Math Classes'}*
*WEEKLY MATHEMATICS TEST REPORT*
━━━━━━━━━━━━━━━━━━━━━━━
Student: *${student.fullName || student.name}* (Roll: ${student.studentId || student.rollNo})
Class: ${student.class || student.grade}
Test: *${activeTest.title}*
Topic: ${activeTest.topicsCovered || activeTest.topic || activeTest.subject}
Date: ${formatDate(activeTest.testDate)}
━━━━━━━━━━━━━━━━━━━━━━━
• Attendance: *${markEntry.isPresent ? 'Present' : 'Absent'}*
${markEntry.isPresent ? `• Marks Obtained: *${score} / ${maxMarks}* (${pct}%)
• Result: *${status}*` : '• Remarks: Student was absent for this scheduled evaluation'}
${markEntry.remarks ? `• Teacher's Note: _"${markEntry.remarks}"_` : ''}
━━━━━━━━━━━━━━━━━━━━━━━
Faculty: ${settings.facultyName ? settings.facultyName.split('(')[0] : 'Vanita Rani Gupta'}
${settings.phone ? `Contact: ${settings.phone}` : ''}`

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-r from-neutral-50 via-amber-50/50 to-neutral-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
              <PenLine className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Input Test Marks & Publish Results
              </h2>
              <p className="text-xs text-neutral-500">
                Enter student-wise marks, record attendance, and publish results to Student Portal & WhatsApp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter / Selector Bar */}
        <div className="p-4 bg-neutral-50 border-b border-neutral-200 grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          {/* 1. Select Standard/Class */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
              1. Standard / Class <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedStandard}
              onChange={(e) => {
                setSelectedStandard(e.target.value)
                setSelectedTestId('')
              }}
              className="w-full px-3 py-2 text-xs font-semibold border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white"
            >
              <option value="10th">Class 10th (Board)</option>
              <option value="9th">Class 9th</option>
              <option value="8th">Class 8th</option>
              <option value="11th">+1 (11th) Mathematics</option>
              <option value="12th">+2 (12th Board)</option>
            </select>
          </div>

          {/* 2. Select Subject */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
              2. Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              placeholder="e.g. Mathematics"
              className="w-full px-3 py-2 text-xs font-semibold border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white"
            />
          </div>

          {/* 3. Select Test */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
              3. Select Test <span className="text-rose-500">*</span>
            </label>
            <select
              value={activeTest ? (activeTest._id || activeTest.id) : ''}
              onChange={(e) => setSelectedTestId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white text-neutral-900"
            >
              {availableTests.length === 0 ? (
                <option value="">No tests found for this class</option>
              ) : (
                availableTests.map((t) => (
                  <option key={t._id || t.id} value={t._id || t.id}>
                    {t.title} ({formatDate(t.testDate)}) - Max: {t.maxMarks || t.totalMarks}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Test Summary Banner & Quick Score Fill */}
        {activeTest && (
          <div className="px-4 py-2.5 bg-amber-50/80 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-3 text-xs">
              <span className="font-bold text-amber-950">{activeTest.title}</span>
              <span className="text-amber-800">·</span>
              <span className="font-mono text-neutral-600">Total Marks: {maxMarks}</span>
              <span className="text-amber-800">·</span>
              <span className="font-mono text-neutral-600">Passing: {passingMarks}</span>
              <span className="text-amber-800">·</span>
              <span className="text-emerald-700 font-medium">{targetStudents.length} Students in {selectedStandard}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-neutral-600">Quick Fill:</span>
              {[100, 90, 80, 70, 50].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleQuickFillPercentage(pct)}
                  className="px-2 py-0.5 bg-white border border-amber-300 rounded text-[11px] font-bold text-amber-950 hover:bg-amber-100 cursor-pointer"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mx-4 mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-4 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Student Marks Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {!activeTest ? (
            <div className="py-12 text-center text-neutral-400">
              <p className="text-xs">Please create a test or select an existing test to enter marks.</p>
            </div>
          ) : targetStudents.length === 0 ? (
            <div className="py-12 text-center text-neutral-400">
              <p className="text-xs">No active students enrolled in {selectedStandard}.</p>
            </div>
          ) : (
            <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-neutral-100 text-neutral-700 font-semibold sticky top-0 z-10 border-b border-neutral-200">
                  <tr>
                    <th className="py-2.5 px-3">Roll & Student</th>
                    <th className="py-2.5 px-3 text-center w-24">Attendance</th>
                    <th className="py-2.5 px-3 text-center w-24">Total Marks</th>
                    <th className="py-2.5 px-3 text-center w-32">Marks Obtained</th>
                    <th className="py-2.5 px-3 text-center w-20">Score %</th>
                    <th className="py-2.5 px-3">Remarks / Feedback</th>
                    <th className="py-2.5 px-3 text-center w-28">Send to Student</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {targetStudents.map((s) => {
                    const sId = s._id || s.id
                    const sEntry = marksState[sId] || { marksObtained: '', marksInputRaw: '', isPresent: true, remarks: '' }
                    const isPresent = sEntry.isPresent
                    const marksNum = isPresent && sEntry.marksObtained !== '' ? Number(sEntry.marksObtained) : null
                    const pct = marksNum != null ? Math.round((marksNum / maxMarks) * 100) : null
                    const isPass = marksNum != null && marksNum >= passingMarks
                    const waUrl = buildWhatsAppResultUrl(s, sEntry)

                    return (
                      <tr key={sId} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-2 px-3">
                          <span className="font-bold text-neutral-900 block">{s.fullName || s.name}</span>
                          <span className="font-mono text-[11px] text-neutral-500">{s.studentId || s.rollNo}</span>
                        </td>

                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleAttendance(sId)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                              isPresent
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            {isPresent ? 'Present' : 'Absent'}
                          </button>
                        </td>

                        {/* Box 1: Total Marks of the test */}
                        <td className="py-2 px-3 text-center">
                          <div className="inline-flex items-center justify-center w-16 py-1 font-mono font-bold text-xs bg-neutral-100 text-neutral-800 border border-neutral-300 rounded shadow-2xs" title="Total Marks of this test">
                            {maxMarks}
                          </div>
                        </td>

                        {/* Box 2: Marks Obtained typed by admin */}
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            disabled={!isPresent}
                            min="0"
                            max={maxMarks}
                            placeholder="Score"
                            value={isPresent ? sEntry.marksInputRaw : ''}
                            onChange={(e) => handleMarkChange(sId, e.target.value)}
                            className="w-24 px-2.5 py-1 text-center font-mono font-bold text-xs border border-amber-400 bg-amber-50/50 focus:bg-white rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-600 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:border-neutral-200"
                            title="Enter marks obtained by student"
                          />
                        </td>

                        <td className="py-2 px-3 text-center">
                          {isPresent && pct != null ? (
                            <span
                              className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                                isPass ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {pct}%
                            </span>
                          ) : (
                            <span className="text-neutral-400 text-xs font-mono">-</span>
                          )}
                        </td>

                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder="e.g. Good steps in Q3, revise formulas"
                            value={sEntry.remarks}
                            onChange={(e) => {
                              const val = e.target.value
                              setMarksState((prev) => ({
                                ...prev,
                                [sId]: { ...prev[sId], remarks: val }
                              }))
                            }}
                            className="w-full px-2 py-1 text-xs border border-neutral-300 rounded focus:ring-1 focus:ring-amber-500 bg-white"
                          />
                        </td>

                        <td className="py-2 px-3 text-center">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 active:bg-emerald-300 rounded-md transition-all shadow-2xs cursor-pointer"
                            title="Send scorecard directly to student & parent WhatsApp"
                          >
                            <Send className="w-3 h-3 text-emerald-700" />
                            <span>Send</span>
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Actions: Save Marks & Publish Results */}
        <div className="px-5 py-3.5 border-t border-neutral-200 bg-neutral-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-neutral-500 font-medium">
            {targetStudents.length} Students · Test: {activeTest?.title || 'None Selected'}
          </span>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>

            {/* Save Marks Button */}
            <button
              type="button"
              onClick={() => handleProcessSubmit(false)}
              className="px-4 py-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>Save Marks</span>
            </button>

            {/* Publish Results Button */}
            <button
              type="button"
              onClick={() => handleProcessSubmit(true)}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publish Results</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
