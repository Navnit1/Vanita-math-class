import { useQuery } from '@tanstack/react-query'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoader, EmptyState } from '@/components/ui'
import { testReportService } from '@/services'
import { formatDate } from '@/lib/utils'
import { ClipboardCheck, Download, FileText } from 'lucide-react'

export default function StudentTestReports() {
  const { data, isLoading } = useQuery({
    queryKey: ['testReports', 'mine'],
    queryFn: testReportService.getMine,
  })

  const reports = data?.reports || []

  return (
    <Sidebar>
      <div className="page-header">
        <h1 className="page-title">Test Reports</h1>
        <p className="page-subtitle">View and download your test result PDFs</p>
      </div>

      {isLoading ? <PageLoader /> : reports.length === 0 ? (
        <div className="card"><EmptyState icon={ClipboardCheck} title="No test reports yet" description="Your teacher will upload your test results here." /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map(r => (
            <div key={r._id} className="card-hover p-5 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm leading-tight">{r.title}</p>
                  {r.subject && <p className="text-xs text-slate-500 mt-0.5">{r.subject}</p>}
                </div>
              </div>

              {r.marksObtained != null && r.totalMarks != null && (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-slate-900">{r.marksObtained}</span>
                  <span className="text-sm text-slate-400">/ {r.totalMarks}</span>
                  <span className="text-xs text-slate-500 ml-1">
                    ({Math.round((r.marksObtained / r.totalMarks) * 100)}%)
                  </span>
                </div>
              )}

              {r.remarks && <p className="text-xs text-slate-600 italic">"{r.remarks}"</p>}

              <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                <p className="text-xs text-slate-400">
                  {r.testDate ? formatDate(r.testDate) : formatDate(r.createdAt)}
                </p>
                <button onClick={() => testReportService.download(r._id, r.fileName)} className="btn btn-primary btn-sm">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Sidebar>
  )
}