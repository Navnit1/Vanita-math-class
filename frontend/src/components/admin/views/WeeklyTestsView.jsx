import { useState, useEffect, useMemo } from 'react'
import {
  ClipboardList,
  Plus,
  PenLine,
  Search,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  MessageSquare,
  Users,
  Award,
  Calendar,
  Sparkles,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Filter
} from 'lucide-react'
import { formatDate } from '@/utils/formatters'
import ScheduleTestModal from '../modals/ScheduleTestModal'
import AddMarksModal from '../modals/AddMarksModal'

export default function WeeklyTestsView({
  tests = [],
  marks = [],
  students = [],
  batches = [],
  settings = {},
  onSaveTest,
  onDeleteTest,
  onSaveMarks,
  isQuickInputOpen = false,
  onCloseQuickInput,
}) {
  const [standardFilter, setStandardFilter] = useState('all')
  const [activeSectionTab, setActiveSectionTab] = useState('all') // 'all', 'upcoming', 'pending', 'completed'
  const [searchTerm, setSearchTerm] = useState('')

  // Modals state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [testToEdit, setTestToEdit] = useState(null)
  const [isAddMarksOpen, setIsAddMarksOpen] = useState(false)
  const [selectedTestForMarksId, setSelectedTestForMarksId] = useState(null)

  // Open Add Marks if quick input requested
  useEffect(() => {
    if (isQuickInputOpen) {
      setIsAddMarksOpen(true)
      if (tests.length > 0) {
        setSelectedTestForMarksId(tests[0]._id || tests[0].id)
      }
    }
  }, [isQuickInputOpen, tests])

  // Categorize tests into Upcoming, Pending, Completed
  const categorizedTests = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const upcoming = []
    const pending = []
    const completed = []

    tests.forEach((t) => {
      const tDate = new Date(t.testDate || t.date || Date.now())
      tDate.setHours(0, 0, 0, 0)
      const tId = t._id || t.id

      // Calculate graded count
      const testMarks = marks.filter((m) => (m.testId?._id || m.testId) === tId)
      const isGraded = (t.status === 'completed') || testMarks.length > 0

      if (isGraded) {
        completed.push(t)
      } else if (tDate < today) {
        // Conducted in the past but marks not yet entered/published
        pending.push(t)
      } else {
        // Scheduled for today or future
        upcoming.push(t)
      }
    })

    return { upcoming, pending, completed }
  }, [tests, marks])

  // Filter helper
  const filterList = (list) => {
    return list.filter((t) => {
      const tGrade = t.class || t.grade || ''
      const matchesStandard = standardFilter === 'all' || tGrade === standardFilter
      const q = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (t.title || '').toLowerCase().includes(q) ||
        (t.topicsCovered || t.topic || '').toLowerCase().includes(q) ||
        (t.subject || '').toLowerCase().includes(q)

      return matchesStandard && matchesSearch
    })
  }

  const filteredUpcoming = useMemo(() => filterList(categorizedTests.upcoming), [categorizedTests.upcoming, standardFilter, searchTerm])
  const filteredPending = useMemo(() => filterList(categorizedTests.pending), [categorizedTests.pending, standardFilter, searchTerm])
  const filteredCompleted = useMemo(() => filterList(categorizedTests.completed), [categorizedTests.completed, standardFilter, searchTerm])

  const totalFilteredCount = filteredUpcoming.length + filteredPending.length + filteredCompleted.length

  const handleOpenAddMarks = (testId = null) => {
    setSelectedTestForMarksId(testId)
    setIsAddMarksOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* 1. Modals */}
      <ScheduleTestModal
        isOpen={isScheduleOpen}
        onClose={() => {
          setIsScheduleOpen(false)
          setTestToEdit(null)
        }}
        onSave={(data) => {
          if (onSaveTest) onSaveTest(data)
          setIsScheduleOpen(false)
          setTestToEdit(null)
        }}
        testToEdit={testToEdit}
        batches={batches}
      />

      <AddMarksModal
        isOpen={isAddMarksOpen}
        onClose={() => {
          setIsAddMarksOpen(false)
          setSelectedTestForMarksId(null)
          if (onCloseQuickInput) onCloseQuickInput()
        }}
        tests={tests}
        students={students}
        marks={marks}
        settings={settings}
        initialTestId={selectedTestForMarksId}
        onSaveMarks={(testId, marksList, isPublish) => {
          if (onSaveMarks) onSaveMarks(testId, marksList, isPublish)
        }}
      />

      {/* 2. Top Header with 2 Main Action Buttons: CREATE TEST & ADD MARKS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
            <span>VMC Academic Evaluation</span>
            <span>·</span>
            <span className="font-mono">{tests.length} Total Tests</span>
            <span>·</span>
            <span className="text-emerald-700 font-bold">{categorizedTests.completed.length} Published</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
            Test Management
          </h1>
        </div>

        {/* The Two Main Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Action 1: CREATE TEST */}
          <button
            type="button"
            onClick={() => {
              setTestToEdit(null)
              setIsScheduleOpen(true)
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl transition-all cursor-pointer shadow-sm"
            title="Create and schedule a new test"
          >
            <Plus className="w-4 h-4" />
            <span>+ CREATE TEST</span>
          </button>

          {/* Action 2: ADD MARKS */}
          <button
            type="button"
            onClick={() => handleOpenAddMarks()}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-xl transition-all cursor-pointer shadow-sm ring-1 ring-amber-500/50"
            title="Open popup to enter marks for any class and test"
          >
            <PenLine className="w-4 h-4" />
            <span>✍️ ADD MARKS</span>
          </button>
        </div>
      </div>

      {/* 3. Filter Bar: Standard/Class Dropdown, Section Tabs, and Search */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tests by title, topic (Quadratic, Calculus, AP) or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-neutral-50/50"
            />
          </div>

          {/* D. STANDARD-WISE TEST FILTERING DROPDOWN */}
          <div className="w-full md:w-72">
            <select
              value={standardFilter}
              onChange={(e) => setStandardFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-bold border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white text-neutral-800"
            >
              <option value="all">All Standards / Classes</option>
              <option value="8th Class">Class 8th</option>
              <option value="9th Class">Class 9th</option>
              <option value="10th Class">Class 10th (Board)</option>
              <option value="+1 (11th) Mathematics">+1 (11th)</option>
              <option value="+2 (12th) Mathematics">+2 (12th Board)</option>
            </select>
          </div>
        </div>

        {/* Section Navigation Tabs (All, Upcoming, Pending, Completed) */}
        <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSectionTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSectionTab === 'all'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            All Sections ({totalFilteredCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveSectionTab('upcoming')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSectionTab === 'upcoming'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-neutral-600 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Upcoming Tests ({filteredUpcoming.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSectionTab('pending')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSectionTab === 'pending'
                ? 'bg-amber-500 text-neutral-950 shadow-xs'
                : 'text-neutral-600 hover:bg-amber-50 hover:text-amber-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Pending Tests ({filteredPending.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSectionTab('completed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSectionTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-neutral-600 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Completed Tests ({filteredCompleted.length})</span>
          </button>
        </div>
      </div>

      {/* 4. C. TEST TAB DASHBOARD SECTIONS */}

      {/* SECTION 1: UPCOMING TESTS */}
      {(activeSectionTab === 'all' || activeSectionTab === 'upcoming') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-800">
                1. Upcoming Tests
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                {filteredUpcoming.length}
              </span>
            </div>
            <span className="text-xs text-neutral-400">Scheduled evaluations awaiting conduct date</span>
          </div>

          {filteredUpcoming.length === 0 ? (
            <div className="bg-white border border-dashed border-neutral-200 rounded-xl p-6 text-center text-xs text-neutral-400">
              No upcoming tests scheduled for the selected filter. Click "+ CREATE TEST" to schedule one.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUpcoming.map((test) => (
                <div
                  key={test._id || test.id}
                  className="bg-white border border-neutral-200 rounded-xl p-4 hover:border-blue-300 transition-all shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 uppercase">
                        {test.class || test.grade}
                      </span>
                      <span className="text-xs font-mono font-bold text-neutral-600">
                        {formatDate(test.testDate)}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-neutral-900 text-sm leading-snug">{test.title}</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Subject: <strong className="text-neutral-700">{test.subject || 'Mathematics'}</strong>
                      </p>
                      <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                        Topics: {test.topicsCovered || test.topic}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 text-center font-mono text-xs">
                      <div className="bg-neutral-50 p-1.5 rounded">
                        <span className="text-[10px] text-neutral-400 block">Total Marks</span>
                        <span className="font-bold text-neutral-800">{test.maxMarks || test.totalMarks || 50}</span>
                      </div>
                      <div className="bg-neutral-50 p-1.5 rounded">
                        <span className="text-[10px] text-neutral-400 block">Passing Marks</span>
                        <span className="font-bold text-neutral-800">{test.passingMarks || 20}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={() => handleOpenAddMarks(test._id || test.id)}
                      className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
                    >
                      <PenLine className="w-3.5 h-3.5" />
                      <span>Enter Marks</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setTestToEdit(test)
                          setIsScheduleOpen(true)
                        }}
                        className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded cursor-pointer"
                        title="Edit Test"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete test "${test.title}"?`)) {
                            onDeleteTest(test._id || test.id)
                          }
                        }}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 rounded cursor-pointer"
                        title="Delete Test"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: PENDING TESTS */}
      {(activeSectionTab === 'all' || activeSectionTab === 'pending') && (
        <div className="space-y-3 pt-4 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-800">
                2. Pending Tests
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                {filteredPending.length}
              </span>
            </div>
            <span className="text-xs text-amber-700 font-medium">Tests conducted whose marks are not yet published</span>
          </div>

          {filteredPending.length === 0 ? (
            <div className="bg-white border border-dashed border-neutral-200 rounded-xl p-6 text-center text-xs text-neutral-400">
              No pending tests requiring marks input.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPending.map((test) => (
                <div
                  key={test._id || test.id}
                  className="bg-white border-2 border-amber-300 rounded-xl p-4 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 uppercase">
                        {test.class || test.grade}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded">
                        Date: {formatDate(test.testDate)}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-neutral-900 text-sm">{test.title}</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Subject: <strong className="text-neutral-700">{test.subject || 'Mathematics'}</strong>
                      </p>
                      <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                        Topics: {test.topicsCovered || test.topic}
                      </p>
                    </div>

                    <div className="p-2 bg-amber-50 rounded-lg text-[11px] text-amber-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Conducted · Marks entry pending</span>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleOpenAddMarks(test._id || test.id)}
                      className="w-full py-2 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-amber-950 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <PenLine className="w-3.5 h-3.5" />
                      <span>✍️ Add Marks Now</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: COMPLETED TESTS */}
      {(activeSectionTab === 'all' || activeSectionTab === 'completed') && (
        <div className="space-y-3 pt-4 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-800">
                3. Completed Tests
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold">
                {filteredCompleted.length}
              </span>
            </div>
            <span className="text-xs text-emerald-700 font-medium">Results published and visible in Student Portal</span>
          </div>

          {filteredCompleted.length === 0 ? (
            <div className="bg-white border border-dashed border-neutral-200 rounded-xl p-6 text-center text-xs text-neutral-400">
              No completed tests recorded yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompleted.map((test) => {
                const tId = test._id || test.id
                const testMarks = marks.filter((m) => (m.testId?._id || m.testId) === tId)
                const gradedCount = testMarks.length
                const presentMarks = testMarks.filter((m) => m.isPresent !== false && m.attendance !== 'absent')
                const highestMarks = presentMarks.length > 0
                  ? Math.max(...presentMarks.map((m) => Number(m.marksObtained || 0)))
                  : 0
                const avgMarks = presentMarks.length > 0
                  ? Math.round(presentMarks.reduce((sum, m) => sum + Number(m.marksObtained || 0), 0) / presentMarks.length)
                  : 0

                return (
                  <div
                    key={tId}
                    className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 uppercase">
                          {test.class || test.grade}
                        </span>
                        <span className="text-xs font-mono text-neutral-500">
                          Published: {formatDate(test.testDate)}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-neutral-900 text-sm leading-snug">{test.title}</h3>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Subject: <strong className="text-neutral-700">{test.subject || 'Mathematics'}</strong>
                        </p>
                        <p className="text-xs text-neutral-600 mt-1 line-clamp-1">
                          Topics: {test.topicsCovered || test.topic}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-neutral-100 text-center font-mono text-xs">
                        <div className="bg-neutral-50 p-1.5 rounded">
                          <span className="text-[10px] text-neutral-400 block">Graded</span>
                          <span className="font-bold text-neutral-800">{gradedCount}</span>
                        </div>
                        <div className="bg-neutral-50 p-1.5 rounded">
                          <span className="text-[10px] text-neutral-400 block">High Score</span>
                          <span className="font-bold text-emerald-700">{highestMarks}</span>
                        </div>
                        <div className="bg-neutral-50 p-1.5 rounded">
                          <span className="text-[10px] text-neutral-400 block">Avg Score</span>
                          <span className="font-bold text-neutral-800">{avgMarks}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleOpenAddMarks(tId)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View / Edit Results</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete completed test "${test.title}" and its results?`)) {
                            onDeleteTest(tId)
                          }
                        }}
                        className="p-1 text-neutral-400 hover:text-rose-600 rounded cursor-pointer"
                        title="Delete Test"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
