import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal, FormField, Select, Badge } from '@/components/ui'
import { weeklyTestService } from '@/services'
import { formatDate } from '@/lib/utils'
import { getWhatsAppTestResultUrl } from '@/lib/whatsapp'
import {
  PenTool, Loader2, Save, Send, Users, CheckCircle2,
  AlertCircle, ExternalLink, Award, Check, X
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function SelectAndGradeTestModal({ isOpen, onClose, initialTestId = null }) {
  const [selectedTestId, setSelectedTestId] = useState(initialTestId || '')
  const [marksSheet, setMarksSheet] = useState([])
  const [isDirty, setIsDirty] = useState(false)
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false)
  const [whatsappModalData, setWhatsappModalData] = useState(null)

  const qc = useQueryClient()

  // 1. Fetch available tests
  const { data: testsData, isLoading: testsLoading } = useQuery({
    queryKey: ['weekly-tests-list'],
    queryFn: () => weeklyTestService.getAll({ limit: 50 }),
    enabled: isOpen,
  })
  const tests = testsData?.tests || []

  // Auto-select latest test if none provided
  useEffect(() => {
    if (initialTestId) {
      setSelectedTestId(initialTestId)
    } else if (!selectedTestId && tests.length > 0) {
      setSelectedTestId(tests[0]._id)
    }
  }, [initialTestId, tests, selectedTestId])

  // 2. Fetch sheet for selected test
  const { data: sheetData, isLoading: sheetLoading } = useQuery({
    queryKey: ['weekly-test-sheet-modal', selectedTestId],
    queryFn: () => weeklyTestService.getSheet(selectedTestId),
    enabled: Boolean(isOpen && selectedTestId),
  })

  useEffect(() => {
    if (sheetData?.rows) {
      setMarksSheet(sheetData.rows.map(r => ({ ...r })))
      setIsDirty(false)
    }
  }, [sheetData])

  const currentTest = sheetData?.test || tests.find(t => t._id === selectedTestId)

  // Real-time calculated stats
  const totalStudents = marksSheet.length
  const absentCount = marksSheet.filter(r => r.attendance === 'absent').length
  const presentCount = totalStudents - absentCount
  const gradedRows = marksSheet.filter(r => r.attendance !== 'absent' && r.marksObtained != null && r.marksObtained !== '')
  const highestMarks = gradedRows.length > 0 ? Math.max(...gradedRows.map(r => Number(r.marksObtained))) : 0
  const avgMarks = gradedRows.length > 0
    ? (gradedRows.reduce((acc, r) => acc + Number(r.marksObtained), 0) / gradedRows.length).toFixed(1)
    : '0.0'
  const passingMarks = currentTest?.passingMarks || 20
  const passedCount = gradedRows.filter(r => Number(r.marksObtained) >= passingMarks).length
  const failedCount = gradedRows.length - passedCount

  // Handlers for marks and attendance
  const handleMarksChange = (idx, val) => {
    const copy = [...marksSheet]
    const row = copy[idx]
    if (val === '') {
      row.marksObtained = null
      row.percentage = 0
      row.result = 'fail'
    } else {
      const num = Number(val)
      const max = currentTest?.maxMarks || 50
      if (num < 0 || num > max) {
        toast.error(`Marks must be between 0 and ${max}`)
        return
      }
      row.marksObtained = num
      row.percentage = Math.round((num / max) * 100)
      row.result = num >= passingMarks ? 'pass' : 'fail'
    }
    setMarksSheet(copy)
    setIsDirty(true)
  }

  const handleAttendanceToggle = (idx) => {
    const copy = [...marksSheet]
    const row = copy[idx]
    if (row.attendance === 'absent') {
      row.attendance = 'present'
      row.marksObtained = 0
      row.percentage = 0
      row.result = 0 >= passingMarks ? 'pass' : 'fail'
    } else {
      row.attendance = 'absent'
      row.marksObtained = null
      row.percentage = 0
      row.result = 'fail'
    }
    setMarksSheet(copy)
    setIsDirty(true)
  }

  const handleRemarkChange = (idx, text) => {
    const copy = [...marksSheet]
    copy[idx].remarks = text
    setMarksSheet(copy)
    setIsDirty(true)
  }

  // Save Mutation
  const saveMarksMutation = useMutation({
    mutationFn: (marksList) => weeklyTestService.saveMarks(selectedTestId, marksList),
    onSuccess: () => {
      qc.invalidateQueries(['weekly-tests'])
      qc.invalidateQueries(['weekly-test-sheet-modal', selectedTestId])
      qc.invalidateQueries(['admin-dashboard'])
      setIsDirty(false)
      toast.success('Test marks spreadsheet saved successfully!')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save marks')
    },
  })

  const handleSaveMarks = () => {
    if (!selectedTestId) return
    const payload = marksSheet.map(r => ({
      studentId: r.studentId,
      attendance: r.attendance || 'present',
      marksObtained: r.attendance === 'absent' ? 0 : (r.marksObtained != null ? Number(r.marksObtained) : 0),
      remarks: r.remarks || '',
    }))
    saveMarksMutation.mutate(payload)
  }

  // WhatsApp Result Dispatch
  const handleSendWhatsAppResults = async () => {
    try {
      setIsSendingWhatsApp(true)
      const res = await weeklyTestService.sendResultsWhatsApp(selectedTestId, {
        studentIds: marksSheet.map(r => r.studentId),
      })
      if (res.data?.successCount > 0) {
        toast.success(`Dispatched ${res.data.successCount} test results via WhatsApp Cloud API!`)
      } else {
        toast(`WhatsApp Cloud API not configured on server. Direct manual links ready.`, { icon: 'ℹ️' })
      }
      setWhatsappModalData(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch results')
    } finally {
      setIsSendingWhatsApp(false)
    }
  }

  return (
    <>
      <Modal isOpen={isOpen && !whatsappModalData} onClose={onClose} title="Weekly Test Marks Entry & Grading" size="xl">
        <div className="p-6 space-y-4">
          {/* Top Test Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D9DDE3]">
            <div className="flex-1 max-w-md">
              <label className="text-xs font-bold text-[#64748B] block mb-1">Select Scheduled Test</label>
              <Select
                value={selectedTestId}
                onChange={(e) => setSelectedTestId(e.target.value)}
                className="text-xs"
              >
                {tests.map((t) => (
                  <option key={t._id} value={t._id}>
                    Class {t.class} · {t.title} ({formatDate(t.testDate)}) - {t.status?.toUpperCase()}
                  </option>
                ))}
              </Select>
            </div>

            {currentTest && (
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="primary">Class {currentTest.class}</Badge>
                <Badge variant={currentTest.status === 'completed' ? 'green' : 'yellow'}>
                  {currentTest.status?.toUpperCase()}
                </Badge>
                <span className="font-semibold text-[#171717]">Max: {currentTest.maxMarks}M | Pass: {currentTest.passingMarks}M</span>
              </div>
            )}
          </div>

          {/* Real-time Stat Cards Row */}
          {currentTest && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-[#FAFAFA] border border-[#D9DDE3]">
                <span className="text-[#64748B] block text-[10px]">Expected</span>
                <strong className="text-sm text-[#171717]">{totalStudents}</strong>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-emerald-700 block text-[10px]">Present</span>
                <strong className="text-sm text-emerald-800">{presentCount}</strong>
              </div>
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                <span className="text-rose-700 block text-[10px]">Absent</span>
                <strong className="text-sm text-rose-800">{absentCount}</strong>
              </div>
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                <span className="text-blue-700 block text-[10px]">Graded</span>
                <strong className="text-sm text-blue-800">{gradedRows.length}</strong>
              </div>
              <div className="p-2 rounded-lg bg-purple-50 border border-purple-200">
                <span className="text-purple-700 block text-[10px]">Highest</span>
                <strong className="text-sm text-purple-800">{highestMarks}M</strong>
              </div>
              <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200">
                <span className="text-indigo-700 block text-[10px]">Average</span>
                <strong className="text-sm text-indigo-800">{avgMarks}M</strong>
              </div>
              <div className="p-2 rounded-lg bg-green-50 border border-green-200">
                <span className="text-green-700 block text-[10px]">Passed</span>
                <strong className="text-sm text-green-800">{passedCount}</strong>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                <span className="text-amber-700 block text-[10px]">Failed</span>
                <strong className="text-sm text-amber-800">{failedCount}</strong>
              </div>
            </div>
          )}

          {/* Student Roster Table */}
          {sheetLoading ? (
            <div className="py-12 text-center text-xs text-[#64748B]">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#E50914]" />
              Loading student roster…
            </div>
          ) : marksSheet.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#64748B]">
              No active students enrolled in Class {currentTest?.class || ''} yet.
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto border border-[#D9DDE3] rounded-xl">
              <table className="table text-xs">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Attendance</th>
                    <th className="text-center">Marks ({currentTest?.maxMarks}M)</th>
                    <th className="text-center">Pct</th>
                    <th className="text-center">Status</th>
                    <th>Teacher Remarks</th>
                    <th className="text-right">WhatsApp</th>
                  </tr>
                </thead>
                <tbody>
                  {marksSheet.map((r, idx) => {
                    const isAbsent = r.attendance === 'absent'
                    const waUrl = currentTest ? getWhatsAppTestResultUrl(currentTest, { ...r, studentName: r.name, rollNo: r.studentId }) : null

                    return (
                      <tr key={r.studentId} className={isAbsent ? 'bg-[#FAFAFA] opacity-60' : ''}>
                        <td className="font-mono font-bold text-[#E50914]">{r.studentId}</td>
                        <td className="font-bold text-[#171717]">{r.name}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleAttendanceToggle(idx)}
                            className={`btn btn-xs ${isAbsent ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'}`}
                          >
                            {isAbsent ? 'Absent' : 'Present'}
                          </button>
                        </td>
                        <td className="text-center">
                          {isAbsent ? (
                            <span className="text-gray-400 italic">—</span>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              max={currentTest?.maxMarks || 50}
                              value={r.marksObtained != null ? r.marksObtained : ''}
                              onChange={(e) => handleMarksChange(idx, e.target.value)}
                              className="input text-center font-bold text-xs py-1 w-16 mx-auto"
                              placeholder="0"
                            />
                          )}
                        </td>
                        <td className="text-center font-mono font-bold">
                          {isAbsent ? '—' : `${r.percentage || 0}%`}
                        </td>
                        <td className="text-center">
                          {isAbsent ? (
                            <Badge variant="slate">ABSENT</Badge>
                          ) : (
                            <Badge variant={r.result === 'pass' ? 'green' : 'red'}>
                              {r.result === 'pass' ? 'PASS' : 'FAIL'}
                            </Badge>
                          )}
                        </td>
                        <td>
                          <input
                            type="text"
                            value={r.remarks || ''}
                            onChange={(e) => handleRemarkChange(idx, e.target.value)}
                            placeholder={isAbsent ? 'Leave applied' : 'Teacher note'}
                            className="input text-xs py-1"
                          />
                        </td>
                        <td className="text-right">
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary btn-xs text-[#059669] hover:bg-emerald-50"
                              title="Send result manually via WhatsApp"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#D9DDE3]">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSendWhatsAppResults}
                disabled={isSendingWhatsApp || isDirty || marksSheet.length === 0}
                className="btn btn-secondary btn-sm text-[#059669] hover:bg-emerald-50 font-bold text-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-[#059669]" />
                {isSendingWhatsApp ? 'Dispatching Results…' : 'Send Results via WhatsApp'}
              </button>

              <button
                type="button"
                onClick={handleSaveMarks}
                disabled={saveMarksMutation.isPending || !selectedTestId}
                className="btn btn-primary btn-sm font-bold shadow-red-glow flex items-center gap-1.5"
              >
                {saveMarksMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save All Marks
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* WhatsApp Distribution Modal */}
      {whatsappModalData && (
        <Modal isOpen={Boolean(whatsappModalData)} onClose={() => setWhatsappModalData(null)} title="WhatsApp Results Distribution" size="md">
          <div className="p-6 space-y-4">
            <div className="p-3 bg-[#FAFAFA] border border-[#D9DDE3] rounded-xl flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-[#171717]">{currentTest?.title}</p>
                <p className="text-[#64748B]">Class {currentTest?.class} · Max: {currentTest?.maxMarks}M</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-sm text-[#059669]">
                  {whatsappModalData.successCount} / {whatsappModalData.total}
                </span>
                <p className="text-[10px] text-[#64748B]">Delivered via Cloud API</p>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-[#F3F4F6] border border-[#D9DDE3] rounded-xl">
              {(whatsappModalData.dispatches || []).map((d) => (
                <div key={d.studentId} className="p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-[#171717] truncate">{d.name}</p>
                    <p className="text-[#64748B] text-[11px] font-mono">
                      Roll: {d.studentId} · {d.phone || 'No phone'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={d.success ? 'green' : 'slate'} className="text-[10px]">
                      {d.success ? 'Sent (Cloud API)' : d.status}
                    </Badge>
                    {d.directLink && (
                      <a
                        href={d.directLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-xs text-[#059669] hover:bg-emerald-50 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Manual
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setWhatsappModalData(null)}
                className="btn btn-primary btn-sm text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
