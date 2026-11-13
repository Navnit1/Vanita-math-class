import { useState, useEffect } from 'react'
import { X, UserPlus, Users } from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'

const AVATAR_COLORS = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#7c3aed', '#e11d48']

export default function AddStudentModal({
  isOpen,
  onClose,
  onSave,
  studentToEdit = null,
  batches = [],
  existingStudents = [],
  settings = {},
}) {
  const [name, setName] = useState('')
  const [rollNo, setRollNo] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('vanita')
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [grade, setGrade] = useState('10th Class')
  const [schoolOrCollege, setSchoolOrCollege] = useState('')
  const [admissionDate, setAdmissionDate] = useState('')
  const [batchIds, setBatchIds] = useState([])
  const [discountPercent, setDiscountPercent] = useState(0)
  const [status, setStatus] = useState('active')
  const [notes, setNotes] = useState('')
  const [avatarColor, setAvatarColor] = useState('#4f46e5')

  useEffect(() => {
    if (studentToEdit) {
      setName(studentToEdit.fullName || studentToEdit.name || '')
      setRollNo(studentToEdit.studentId || studentToEdit.rollNo || '')
      setPhone(studentToEdit.phone || '')
      setEmail(studentToEdit.email || '')
      setPassword(studentToEdit.password || 'vanita')
      setGuardianName(studentToEdit.parentName || studentToEdit.guardianName || '')
      setGuardianPhone(studentToEdit.parentPhone || studentToEdit.guardianPhone || '')
      setGrade(studentToEdit.class || studentToEdit.grade || '10th Class')
      setSchoolOrCollege(studentToEdit.school || studentToEdit.schoolOrCollege || '')
      setAdmissionDate(
        studentToEdit.admissionDate
          ? String(studentToEdit.admissionDate).slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      )
      setBatchIds(studentToEdit.batchIds || [])
      setDiscountPercent(Number(studentToEdit.discountPercent || 0))
      setStatus(studentToEdit.status || 'active')
      setNotes(studentToEdit.notes || '')
      setAvatarColor(studentToEdit.avatarColor || '#4f46e5')
    } else {
      const nextNum = (existingStudents.length || 0) + 107
      setRollNo(`VMC-${nextNum}`)
      setName('')
      setPhone('')
      setEmail('')
      setPassword('vanita')
      setGuardianName('')
      setGuardianPhone('')
      setGrade('10th Class')
      setSchoolOrCollege('')
      setAdmissionDate(new Date().toISOString().slice(0, 10))
      setBatchIds(batches.length > 0 ? [batches[0].id || batches[0].batchId] : [])
      setDiscountPercent(0)
      setStatus('active')
      setNotes('')
      setAvatarColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)])
    }
  }, [studentToEdit, isOpen, existingStudents.length, batches])

  if (!isOpen) return null

  // Calculate gross and net monthly fee
  const grossFee = batchIds.reduce((sum, bId) => {
    const b = batches.find((item) => (item.id || item.batchId) === bId)
    return sum + Number(b?.monthlyFee || 0)
  }, 0) || 2500

  const netFee = discountPercent > 0
    ? Math.max(0, Math.round(grossFee - (grossFee * discountPercent) / 100))
    : grossFee

  const toggleBatch = (bId) => {
    setBatchIds((prev) =>
      prev.includes(bId) ? prev.filter((id) => id !== bId) : [...prev, bId]
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !rollNo.trim()) {
      alert('Please provide student name and roll number')
      return
    }

    const payload = {
      ...(studentToEdit ? { _id: studentToEdit._id, id: studentToEdit.id || studentToEdit._id } : {}),
      fullName: name.trim(),
      name: name.trim(),
      studentId: rollNo.trim(),
      rollNo: rollNo.trim(),
      phone: phone.trim(),
      email: email.trim() || `${rollNo.toLowerCase().replace('-', '')}@vmc.local`,
      password: password.trim() || 'vanita',
      parentName: guardianName.trim(),
      guardianName: guardianName.trim(),
      parentPhone: guardianPhone.trim(),
      guardianPhone: guardianPhone.trim(),
      class: grade,
      grade,
      school: schoolOrCollege.trim(),
      schoolOrCollege: schoolOrCollege.trim(),
      admissionDate,
      batchIds,
      batch: batches.find(b => batchIds.includes(b.id || b.batchId))?.name || 'Class 10th - Board Target & Mathematics Mastery',
      monthlyFee: netFee,
      discountPercent: Number(discountPercent) || 0,
      status,
      notes: notes.trim(),
      avatarColor,
    }

    onSave(payload)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-neutral-200">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">
              {studentToEdit ? 'Edit Student Profile' : 'Enroll New Mathematics Student'}
            </h2>
            <p className="text-xs text-neutral-500">
              Vanita Math Classes · Admission, contacts, and batch allocation
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-xs sm:text-sm">
          {/* Name & Roll No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Student Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Diya Singhal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Roll Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. VMC-101"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                className="w-full px-3 py-2 font-mono font-semibold border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>
          </div>

          {/* Grade, Student Phone, Password */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Class / Grade (Mathematics) <span className="text-rose-500">*</span>
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white font-medium"
              >
                <option value="8th Class">Class 8th Mathematics</option>
                <option value="9th Class">Class 9th Mathematics</option>
                <option value="10th Class">Class 10th Mathematics</option>
                <option value="+1 (11th) Mathematics">+1 (11th) Mathematics</option>
                <option value="+2 (12th) Mathematics">+2 (12th) Mathematics</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Student Mobile / WhatsApp <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 font-mono border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Portal Login Password
              </label>
              <input
                type="text"
                placeholder="Default: vanita"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 font-mono border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>
          </div>

          {/* Guardian Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Parent / Guardian Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Vikas Singhal"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Parent Phone (WhatsApp Reminders) <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="10-digit phone"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                className="w-full px-3 py-2 font-mono border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>
          </div>

          {/* School & Admission Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                School / College Name
              </label>
              <input
                type="text"
                placeholder="e.g. St. Xavier School / DPS Bathinda"
                value={schoolOrCollege}
                onChange={(e) => setSchoolOrCollege(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Admission Date
              </label>
              <input
                type="date"
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                className="w-full px-3 py-2 font-mono border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>
          </div>

          {/* Batch Allocation */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Enrolled Batch(es)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 border border-neutral-200 rounded-lg">
              {batches.map((b) => {
                const bId = b.id || b.batchId
                const checked = batchIds.includes(bId)
                return (
                  <label
                    key={bId}
                    className={`flex items-start gap-2 p-2 border rounded-lg cursor-pointer transition-colors ${
                      checked ? 'bg-indigo-50/70 border-indigo-300' : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleBatch(bId)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-neutral-900">{b.name}</p>
                      <p className="text-[11px] text-neutral-500 font-mono">
                        {formatCurrency(b.monthlyFee, settings.currencySymbol)}/mo · {b.schedule}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Concession, Status & Fee Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Concession / Waiver (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full px-3 py-1.5 font-mono border border-neutral-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Student Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg bg-white font-medium"
              >
                <option value="active">Active (Enrolled)</option>
                <option value="inactive">Inactive / On Leave</option>
              </select>
            </div>

            <div>
              <span className="block text-xs text-neutral-500 mb-1">Net Monthly Fee</span>
              <div className="font-mono text-base font-bold text-indigo-700">
                {formatCurrency(netFee, settings.currencySymbol)}
                <span className="text-xs text-neutral-500 font-normal"> / mo</span>
              </div>
            </div>
          </div>

          {/* Goals / Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Academic Goals / Internal Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Aiming for 100/100 in Board Examination. NTSE preparation."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {studentToEdit ? 'Save Changes' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
