import { useState, useEffect } from 'react'
import { X, GraduationCap } from 'lucide-react'

export default function BatchModal({
  isOpen,
  onClose,
  onSave,
  batchToEdit = null,
  settings = {},
}) {
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('Mathematics')
  const [grade, setGrade] = useState('10th Class')
  const [instructor, setInstructor] = useState('Vanita Rani Gupta (M.Sc, M.Phil, B.Ed)')
  const [schedule, setSchedule] = useState('Mon, Wed, Fri · 5:00 PM - 6:30 PM')
  const [monthlyFee, setMonthlyFee] = useState(2500)
  const [capacity, setCapacity] = useState(25)
  const [room, setRoom] = useState('Hall B (Smart Classroom)')
  const [colorTheme, setColorTheme] = useState('emerald')
  const [focus, setFocus] = useState('')

  useEffect(() => {
    if (batchToEdit) {
      setName(batchToEdit.name || '')
      setSubject(batchToEdit.subject || 'Mathematics')
      setGrade(batchToEdit.grade || '10th Class')
      setInstructor(batchToEdit.instructor || 'Vanita Rani Gupta (M.Sc, M.Phil, B.Ed)')
      setSchedule(batchToEdit.schedule || '')
      setMonthlyFee(Number(batchToEdit.monthlyFee || 2500))
      setCapacity(Number(batchToEdit.capacity || 25))
      setRoom(batchToEdit.room || 'Hall A')
      setColorTheme(batchToEdit.colorTheme || 'indigo')
      setFocus(batchToEdit.focus || '')
    } else {
      setName('')
      setSubject('Mathematics')
      setGrade('10th Class')
      setInstructor('Vanita Rani Gupta (M.Sc, M.Phil, B.Ed)')
      setSchedule('Mon, Wed, Fri · 5:00 PM - 6:30 PM')
      setMonthlyFee(2500)
      setCapacity(25)
      setRoom('Hall B (Smart Classroom)')
      setColorTheme('emerald')
      setFocus('')
    }
  }, [batchToEdit, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !grade.trim()) {
      alert('Please fill in batch name and grade')
      return
    }

    const payload = {
      ...(batchToEdit ? { _id: batchToEdit._id, id: batchToEdit.id || batchToEdit._id } : {}),
      name: name.trim(),
      subject: subject.trim(),
      grade,
      instructor: instructor.trim(),
      schedule: schedule.trim(),
      monthlyFee: Number(monthlyFee) || 0,
      capacity: Number(capacity) || 20,
      room: room.trim(),
      colorTheme,
      focus: focus.trim(),
    }

    onSave(payload)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-neutral-200">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">
              {batchToEdit ? 'Edit Mathematics Batch' : 'Create New Mathematics Batch'}
            </h2>
            <p className="text-xs text-neutral-500">
              Vanita Math Classes · Configure grade, schedule, faculty, and monthly fee rate
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Batch Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Class 10th - Board Target & Mathematics Mastery"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>

          {/* Grade & Instructor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Target Grade <span className="text-rose-500">*</span>
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white font-medium"
              >
                <option value="8th Class">Class 8th</option>
                <option value="9th Class">Class 9th</option>
                <option value="10th Class">Class 10th (Board)</option>
                <option value="+1 (11th) Mathematics">+1 (11th)</option>
                <option value="+2 (12th) Mathematics">+2 (12th Board)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Faculty / Instructor
              </label>
              <input
                type="text"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>
          </div>

          {/* Schedule & Room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Weekly Days & Timings <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mon, Wed, Fri · 5:00 PM - 6:30 PM"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Classroom / Hall
              </label>
              <input
                type="text"
                placeholder="e.g. Hall B (Smart Classroom)"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>
          </div>

          {/* Monthly Fee & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Monthly Fee Rate ({settings.currencySymbol || '₹'}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="50"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(Number(e.target.value))}
                className="w-full px-3 py-2 font-mono font-bold text-neutral-900 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Max Student Capacity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                max="100"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 font-mono border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>
          </div>

          {/* Color Theme */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Badge Color Theme
            </label>
            <div className="flex gap-2">
              {['indigo', 'cyan', 'emerald', 'amber', 'purple', 'rose'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setColorTheme(color)}
                  className={`px-3 py-1 text-xs rounded-md font-semibold capitalize border transition-all ${
                    colorTheme === color
                      ? 'ring-2 ring-neutral-900 shadow-xs'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
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
              {batchToEdit ? 'Save Changes' : 'Create Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
