import { normalizeClassKey } from '@/config/pricing'
import { useState, useEffect } from 'react'
import { X, ClipboardList } from 'lucide-react'

export default function ScheduleTestModal({
  isOpen,
  onClose,
  onSave,
  testToEdit = null,
  batches = [],
}) {
  const [title, setTitle] = useState('Weekly Mathematics Test')
  const [grade, setGrade] = useState('10th')
  const [subject, setSubject] = useState('Mathematics')
  const [batchId, setBatchId] = useState('')
  const [topic, setTopic] = useState('')
  const [testDate, setTestDate] = useState(new Date().toISOString().slice(0, 10))
  const [maxMarks, setMaxMarks] = useState(50)
  const [passingMarks, setPassingMarks] = useState(20)
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [description, setDescription] = useState('')
  const [notifyPortal, setNotifyPortal] = useState(true)
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true)

  useEffect(() => {
    if (testToEdit) {
      setTitle(testToEdit.title || '')
      setGrade(testToEdit.class || testToEdit.grade || '10th Class')
      setSubject(testToEdit.subject || 'Mathematics')
      setBatchId(testToEdit.batchId || '')
      setTopic(testToEdit.topicsCovered || testToEdit.topic || '')
      setTestDate(
        testToEdit.testDate
          ? String(testToEdit.testDate).slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      )
      setMaxMarks(Number(testToEdit.maxMarks || 50))
      setPassingMarks(Number(testToEdit.passingMarks || 20))
      setDurationMinutes(Number(testToEdit.durationMinutes || 60))
      setDescription(testToEdit.description || testToEdit.instructions || '')
      setNotifyPortal(testToEdit.notifyPortal !== false)
      setNotifyWhatsApp(testToEdit.notifyWhatsApp !== false)
    } else {
      setTitle('Weekly Mathematics Test')
      setGrade('10th Class')
      setSubject('Mathematics')
      setBatchId('')
      setTopic('')
      setTestDate(new Date().toISOString().slice(0, 10))
      setMaxMarks(50)
      setPassingMarks(20)
      setDurationMinutes(60)
      setDescription('')
      setNotifyPortal(true)
      setNotifyWhatsApp(true)
    }
  }, [testToEdit, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !topic.trim() || !testDate) {
      alert('Please fill all required test fields')
      return
    }

    const payload = {
      ...(testToEdit ? { _id: testToEdit._id, id: testToEdit.id || testToEdit._id } : {}),
      title: title.trim(),
      class: normalizeClassKey(grade) || grade,
      grade: normalizeClassKey(grade) || grade,
      subject: subject.trim() || 'Mathematics',
      batchId: batchId || undefined,
      batch: batches.find(b => (b.id || b.batchId) === batchId)?.name || 'All Batches',
      topic: topic.trim(),
      topicsCovered: topic.trim(),
      testDate,
      startTime: '10:00 AM',
      maxMarks: Number(maxMarks) || 50,
      passingMarks: Number(passingMarks) || 20,
      durationMinutes: Number(durationMinutes) || 60,
      description: description.trim(),
      instructions: description.trim(),
      notifyPortal,
      notifyWhatsApp,
    }

    onSave(payload)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-red-600" />
            <h2 className="text-base font-bold text-neutral-900">
              {testToEdit ? 'Edit Weekly Test' : 'Schedule New Weekly Test'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          {/* Test Title */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Test Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Weekly Test 2: Quadratic Equations & AP Series"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white"
            />
          </div>

          {/* Grade, Subject & Batch */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Standard / Class <span className="text-rose-500">*</span>
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white font-medium"
              >
                <option value="10th">Class 10th (Board)</option>
                <option value="9th">Class 9th</option>
                <option value="8th">Class 8th</option>
                <option value="11th">+1 (11th)</option>
                <option value="12th">+2 (12th Board)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Subject <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mathematics"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Target Batch
              </label>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white font-medium"
              >
                <option value="">All Batches</option>
                {batches
                  .filter((b) => b.grade === grade || !grade)
                  .map((b) => (
                    <option key={b.id || b.batchId} value={b.id || b.batchId}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Topics Covered */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Syllabus Topics Covered <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Discriminant, Nature of Roots, Word problems on AP"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white"
            />
          </div>

          {/* Date, Max Marks, Passing Marks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Test Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="w-full px-3 py-2 font-mono border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Max Marks <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="10"
                max="200"
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
                className="w-full px-3 py-2 font-mono border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Passing Marks <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                max={maxMarks}
                value={passingMarks}
                onChange={(e) => setPassingMarks(Number(e.target.value))}
                className="w-full px-3 py-2 font-mono border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white"
              />
            </div>
          </div>

          {/* Description / Instructions */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Test Description / Instructions
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Section A: 10 MCQs (10M), Section B: 5 Short Answer (15M), Section C: 5 Long Problems (25M)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white"
            />
          </div>

          {/* Notification Options */}
          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 space-y-2">
            <span className="block text-xs font-bold text-neutral-800">
              Notification Options
            </span>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-700">
                <input
                  type="checkbox"
                  checked={notifyPortal}
                  onChange={(e) => setNotifyPortal(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <span>Publish to Student Portal</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-700">
                <input
                  type="checkbox"
                  checked={notifyWhatsApp}
                  onChange={(e) => setNotifyWhatsApp(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Send WhatsApp Alert to Students</span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-100 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {testToEdit ? 'Save Changes' : 'Schedule Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
