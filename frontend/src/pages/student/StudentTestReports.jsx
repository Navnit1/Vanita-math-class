import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, EmptyState, Badge, StatCard } from '@/components/ui'
import { weeklyTestService } from '@/services'
import { formatDate } from '@/lib/utils'
import {
  FileText,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen,
  Info,
} from 'lucide-react'

export default function StudentTestReports() {
  const [activeTab, setActiveTab] = useState('results')

  const { data, isLoading } = useQuery({
    queryKey: ['weeklyTests', 'myResults'],
    queryFn: weeklyTestService.getMyResults,
  })

  const results = data?.results || []
  const upcomingTests = data?.upcomingTests || []
  const stats = data?.stats || { totalTests: 0, passedCount: 0, averagePercentage: 0 }

  return (
    <Sidebar>
      <div className="page-header">
        <h1 className="page-title">Weekly Tests & Performance</h1>
        <p className="page-subtitle">
          View your upcoming test schedules and private weekly test performance reports
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={FileText}
          label="Tests Taken"
          value={stats.totalTests}
          subtext="Graded by Vanita Ma'am"
        />
        <StatCard
          icon={Award}
          label="Tests Passed"
          value={stats.passedCount}
          subtext={`${stats.totalTests > 0 ? Math.round((stats.passedCount / stats.totalTests) * 100) : 0}% success rate`}
        />
        <StatCard
          icon={CheckCircle2}
          label="Average Score"
          value={`${stats.averagePercentage}%`}
          subtext="Overall test average"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-xl px-4 pt-2">
        <button
          onClick={() => setActiveTab('results')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'results'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Award className="w-4 h-4" />
          Test Results ({results.length})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'upcoming'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Upcoming Tests ({upcomingTests.length})
        </button>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : activeTab === 'results' ? (
        results.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={FileText}
              title="No test results yet"
              description="Your test marks and evaluation reports will appear here as soon as tests are conducted and graded."
            />
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((r) => {
              const isAbsent = r.attendance === 'absent'
              const isPass = r.result === 'pass'

              return (
                <div
                  key={r.resultId}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:border-primary-300 transition-all shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Test Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
                          Class {r.class} ({r.batch})
                        </span>
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                          {r.subject || 'Mathematics'}
                        </span>
                        {isAbsent ? (
                          <Badge variant="danger">Absent</Badge>
                        ) : isPass ? (
                          <Badge variant="success">Passed</Badge>
                        ) : (
                          <Badge variant="danger">Needs Improvement</Badge>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 leading-snug">{r.title}</h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-2">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {formatDate(r.testDate)}
                        </span>
                        {r.startTime && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {r.startTime}
                          </span>
                        )}
                      </div>

                      {/* Topics Covered */}
                      {r.topicsCovered && (
                        <div className="mt-3 text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                          <span className="font-semibold text-gray-700">Syllabus Covered: </span>
                          {r.topicsCovered}
                        </div>
                      )}

                      {/* Remarks */}
                      {r.remarks && (
                        <div className="mt-2 text-xs text-primary-900 bg-primary-50/50 rounded-lg p-2.5 border border-primary-100">
                          <span className="font-semibold text-primary-800">Teacher's Note: </span>
                          "{r.remarks}"
                        </div>
                      )}
                    </div>

                    {/* Score Box */}
                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center p-4 bg-gray-50 rounded-xl border border-gray-100 min-w-[160px]">
                      {isAbsent ? (
                        <div className="text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
                            <XCircle className="w-4 h-4" /> Absent
                          </span>
                          <p className="text-[11px] text-gray-400 mt-1">Test missed</p>
                        </div>
                      ) : (
                        <div className="text-right">
                          <div className="flex items-baseline gap-1 justify-end">
                            <span className="text-3xl font-extrabold text-gray-900">
                              {r.marksObtained}
                            </span>
                            <span className="text-sm font-semibold text-gray-400">
                              / {r.maxMarks}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-end gap-1.5">
                            <span
                              className={`text-sm font-bold ${
                                isPass ? 'text-emerald-600' : 'text-red-600'
                              }`}
                            >
                              {r.percentage}%
                            </span>
                            <span className="text-[11px] text-gray-400">
                              (Pass: {r.passingMarks})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* Upcoming Tests Tab */
        upcomingTests.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Calendar}
              title="No upcoming tests scheduled"
              description="New weekly tests scheduled by Vanita Ma'am will be announced here with full syllabus details."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingTests.map((t) => (
              <div
                key={t._id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-primary-300 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
                      Class {t.class} ({t.batch})
                    </span>
                    <span className="text-xs font-bold text-gray-500">
                      Max Marks: {t.maxMarks}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 leading-snug">{t.title}</h3>

                  <div className="mt-3 space-y-2 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary-600 flex-shrink-0" />
                      <span>{formatDate(t.testDate)}</span>
                    </div>
                    {t.startTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary-600 flex-shrink-0" />
                        <span>
                          {t.startTime} {t.duration ? `(${t.duration} mins)` : ''}
                        </span>
                      </div>
                    )}
                    {t.topicsCovered && (
                      <div className="flex items-start gap-2 pt-1">
                        <BookOpen className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Syllabus:</strong> {t.topicsCovered}
                        </span>
                      </div>
                    )}
                    {t.instructions && (
                      <div className="flex items-start gap-2 pt-1 text-gray-500">
                        <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Instructions:</strong> {t.instructions}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>Passing Marks: {t.passingMarks}</span>
                  <span className="text-primary-600 font-semibold">Prepare well!</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </Sidebar>
  )
}
