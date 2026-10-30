import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal, FormField, Select } from '@/components/ui'
import { weeklyTestService } from '@/services'
import { ClipboardCheck, Loader2, Sparkles, Calendar, Clock, Award } from 'lucide-react'
import toast from 'react-hot-toast'

const CLASSES = ['8th', '9th', '10th', '+1', '+2']
const BATCHES = ['All Batches', 'Evening', 'Morning', 'Weekend']

export default function CreateTestModal({ isOpen, onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [studentClass, setStudentClass] = useState('10th')
  const [batch, setBatch] = useState('All Batches')
  const [testDate, setTestDate] = useState(new Date().toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState('10:00 AM')
  const [endTime, setEndTime] = useState('11:30 AM')
  const [durationMinutes, setDurationMinutes] = useState(90)
  const [subject, setSubject] = useState('Mathematics')
  const [topicsCovered, setTopicsCovered] = useState('')
  const [maxMarks, setMaxMarks] = useState(50)
  const [passingMarks, setPassingMarks] = useState(20)
  const [instructions, setInstructions] = useState('Bring your geometry box and blue/black pens. Calculators not permitted.')
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true)

  const qc = useQueryClient()

  const createMutation = useMutation({
    mutationFn: weeklyTestService.create,
    onSuccess: (res) => {
      qc.invalidateQueries(['weekly-tests'])
      qc.invalidateQueries(['admin-dashboard'])
      toast.success('Weekly test scheduled successfully!')
      onClose()
      if (onCreated && res.data?._id) {
        onCreated(res.data)
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to schedule weekly test')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Test title is required')
      return
    }
    if (Number(passingMarks) > Number(maxMarks)) {
      toast.error('Passing marks cannot exceed maximum marks')
      return
    }

    createMutation.mutate({
      title: title.trim(),
      class: studentClass,
      batch,
      testDate,
      startTime,
      endTime,
      durationMinutes: Number(durationMinutes) || 90,
      subject: subject.trim() || 'Mathematics',
      topicsCovered: topicsCovered.trim(),
      maxMarks: Number(maxMarks) || 50,
      passingMarks: Number(passingMarks) || 20,
      instructions: instructions.trim(),
      notifyWhatsApp,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Weekly Test"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Banner */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-3">
          <ClipboardCheck className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div className="text-xs text-red-900 leading-relaxed">
            <p className="font-bold text-red-950">VMC Continuous Evaluation System</p>
            <p className="text-red-800 mt-0.5">
              Scheduling creates a real-time grading sheet for all enrolled active students in this standard.
              Once marks are entered, private results can be sent instantly to parents.
            </p>
          </div>
        </div>

        {/* Row 1: Title & Subject */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <FormField label="Test Title / Chapter" required>
              <input
                type="text"
                placeholder="e.g. Quadratic Equations & AP — Test 01"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                required
              />
            </FormField>
          </div>
          <div>
            <FormField label="Subject">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 font-medium"
              />
            </FormField>
          </div>
        </div>

        {/* Row 2: Standard & Batch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Target Standard / Class" required>
            <Select
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
              className="w-full text-sm font-semibold"
            >
              {CLASSES.map((cls) => (
                <option key={cls} value={cls}>Class {cls}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Target Batch" required>
            <Select
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className="w-full text-sm font-semibold"
            >
              {BATCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </Select>
          </FormField>
        </div>

        {/* Row 3: Test Date, Timing & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField label="Test Date" required>
            <input
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </FormField>

          <FormField label="Start Time">
            <input
              type="text"
              placeholder="e.g. 10:00 AM"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </FormField>

          <FormField label="End Time">
            <input
              type="text"
              placeholder="e.g. 11:30 AM"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </FormField>
        </div>

        {/* Row 4: Marks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
          <FormField label="Maximum Marks" required>
            <input
              type="number"
              min="10"
              max="200"
              value={maxMarks}
              onChange={(e) => setMaxMarks(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-gray-900"
              required
            />
          </FormField>

          <FormField label="Passing Marks (40% default)" required>
            <input
              type="number"
              min="1"
              max={maxMarks}
              value={passingMarks}
              onChange={(e) => setPassingMarks(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-emerald-700"
              required
            />
          </FormField>

          <FormField label="Duration (Minutes)">
            <input
              type="number"
              min="15"
              max="240"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </FormField>
        </div>

        {/* Row 5: Topics Covered */}
        <FormField label="Topics / Syllabus Covered">
          <textarea
            rows="2"
            placeholder="e.g. Standard form, Discriminant, Nature of Roots, Word problems from NCERT & RD Sharma"
            value={topicsCovered}
            onChange={(e) => setTopicsCovered(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </FormField>

        {/* Row 6: Instructions */}
        <FormField label="Special Student Instructions">
          <input
            type="text"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-700"
          />
        </FormField>

        {/* Checkbox: WhatsApp Alert */}
        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={notifyWhatsApp}
            onChange={(e) => setNotifyWhatsApp(e.target.checked)}
            className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300"
          />
          <span className="text-xs text-gray-700 font-medium">
            Notify student & parent WhatsApp about this upcoming scheduled test
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Scheduling...</span>
              </>
            ) : (
              <>
                <ClipboardCheck className="w-4 h-4" />
                <span>Schedule Weekly Test</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
