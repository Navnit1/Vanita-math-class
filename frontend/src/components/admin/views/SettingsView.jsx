import { useState, useEffect } from 'react'
import {
  Settings,
  Building,
  CreditCard,
  Database,
  Save,
  CheckCircle2,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  GraduationCap,
  ArrowUpCircle,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react'

export default function SettingsView({
  settings = {},
  onSaveSettings,
  onResetAllData,
  students = [],
  batches = [],
  payments = [],
  onImportAllData,
  onTransitionAcademicYear,
}) {
  const [formData, setFormData] = useState({
    centerName: 'Vanita Math Classes',
    tagline: 'Mathmatics tuition classes for 8th, 9th, 10th, +1 & +2',
    address: '#302, Phase-II, Vishal Nagar, Bathinda',
    phone: '98159-62612',
    email: 'singla_vikas123@yahhoo.com',
    facultyName: 'Vanita Rani Gupta (M.Sc, M.Phil, B.Ed)',
    upiId: '9815962612@upi',
    accountDetails: 'State Bank of India - Bathinda (Er. Vikas)',
    currencySymbol: '₹',
    receiptPrefix: 'VMC-REC-',
    academicYear: '2026-2027',
    termsAndConditions: 'Fees once paid is non-refundable. Monthly fees must be paid before 10th of every month. Regular attendance in weekly tests is mandatory.',
    ...settings
  })

  const [savedSuccess, setSavedSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [nextYearInput, setNextYearInput] = useState('2027-2028')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionOutcome, setTransitionOutcome] = useState(null)

  const activeStudents = students.filter((s) => s.status === 'active')
  const defaulterStudents = activeStudents.filter((s) => Math.max(0, (s.totalFee || 0) - (s.paidFee || 0)) > 0)
  const graduatingAlumni = activeStudents.filter((s) => {
    const cls = String(s.class || s.grade || '')
    return cls.includes('12') || cls.includes('+2')
  })
  const promotableStudents = activeStudents.filter((s) => {
    const cls = String(s.class || s.grade || '')
    const isAlumni = cls.includes('12') || cls.includes('+2')
    const hasDues = Math.max(0, (s.totalFee || 0) - (s.paidFee || 0)) > 0
    return !isAlumni && !hasDues
  })

  const handleRolloverSession = async () => {
    if (!nextYearInput.trim()) {
      alert('Please specify the new academic year (e.g. 2027-2028)')
      return
    }

    const confirmMsg = `Are you sure you want to transition to Academic Session ${nextYearInput}?\n\n• ${promotableStudents.length} eligible students will be promoted +1 class\n• ${graduatingAlumni.length} Class 12th students will graduate to Alumni\n• ${defaulterStudents.length} students with uncleared fees will be held back until cleared\n• Previous session study notes will be archived safely\n\nThis cannot be undone automatically.`
    if (!window.confirm(confirmMsg)) return

    setIsTransitioning(true)
    try {
      if (onTransitionAcademicYear) {
        const res = await onTransitionAcademicYear({ nextAcademicYear: nextYearInput.trim() })
        setTransitionOutcome(res?.results || null)
        setFormData((prev) => ({ ...prev, academicYear: nextYearInput.trim() }))
      }
    } catch (err) {
      console.error('Session transition failed:', err)
    } finally {
      setIsTransitioning(false)
    }
  }

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setFormData((prev) => ({ ...prev, ...settings }))
    }
  }, [settings])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      if (onSaveSettings) {
        await onSaveSettings(formData)
      }
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to save settings:', err)
      alert('Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Download full JSON backup
  const handleExportBackup = () => {
    const backupData = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      institute: formData.centerName,
      settings: formData,
      batches,
      students,
      payments
    }
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `vmc_backup_${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Restore JSON backup
  const handleImportBackup = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result
        const data = JSON.parse(text)
        if (data && (data.students || data.batches || data.settings)) {
          if (onImportAllData) {
            onImportAllData(data)
          }
          alert('Data backup imported and restored successfully!')
        } else {
          alert('Invalid backup file format: missing student, batch, or settings data.')
        }
      } catch (err) {
        console.error('Backup import error:', err)
        alert('Failed to parse backup JSON file.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
          <span className="flex items-center gap-1">
            <Settings className="w-3.5 h-3.5 text-red-600" />
            System Configuration
          </span>
          <span aria-hidden="true">·</span>
          <span>Center Profile & Preferences</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
          Institute Settings & Data Management
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Configure coaching center details, fee receipt templates, UPI information, and system backups
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Institute Profile Card */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Building className="w-5 h-5 text-red-600" />
            <div>
              <h2 className="text-base font-bold text-neutral-900">Coaching Institute Profile</h2>
              <p className="text-xs text-neutral-500">
                These details are displayed on the public landing page, student portal, and printed receipts
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Coaching Institute / Academy Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.centerName}
                onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Tagline / Courses Offered Subtitle
              </label>
              <input
                type="text"
                placeholder="e.g. Mathmatics tuition classes for 8th, 9th, 10th, +1 & +2"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Official Center Address (Printed on Receipts) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Contact Phone / WhatsApp <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 font-mono border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Official Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Head Faculty & Qualifications
              </label>
              <input
                type="text"
                value={formData.facultyName}
                onChange={(e) => setFormData({ ...formData, facultyName: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Payment & Receipt Configuration */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <CreditCard className="w-5 h-5 text-red-600" />
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Payment & Receipt Configuration
              </h2>
              <p className="text-xs text-neutral-500">
                Setup online payment options, receipt voucher serial prefix, and terms
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                UPI ID (for instant parent payment reminders)
              </label>
              <input
                type="text"
                placeholder="e.g. 9815962612@upi"
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                className="w-full px-3 py-2 font-mono border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Bank Account Details (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. State Bank of India - Bathinda (Er. Vikas)"
                value={formData.accountDetails || ''}
                onChange={(e) => setFormData({ ...formData, accountDetails: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Currency Symbol
              </label>
              <select
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white font-mono"
              >
                <option value="₹">₹ (Indian Rupee - INR)</option>
                <option value="$">$ (US Dollar - USD)</option>
                <option value="€">€ (Euro - EUR)</option>
                <option value="£">£ (British Pound - GBP)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Receipt Number Prefix
              </label>
              <input
                type="text"
                value={formData.receiptPrefix}
                onChange={(e) => setFormData({ ...formData, receiptPrefix: e.target.value })}
                className="w-full px-3 py-2 font-mono border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Academic Session / Year
              </label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Receipt Terms & Conditions (printed at the bottom)
              </label>
              <textarea
                rows={2}
                value={formData.termsAndConditions}
                onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-white text-xs leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Save button and status */}
        <div className="flex items-center justify-end gap-3">
          {savedSuccess && (
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Settings updated successfully!
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg shadow-sm cursor-pointer transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Academic Year Progression & Student Promotion Card */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-neutral-900">Academic Year Progression & Student Promotion</h2>
              <p className="text-xs text-neutral-500">
                Advance active students to next class, graduate 10+2 to Alumni, update monthly fees, archive old notes, and enforce fee clearance
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg">
            Active: {formData.academicYear || '2026-2027'}
          </span>
        </div>

        {/* Transition Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
              <span>Ready for Promotion</span>
              <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-900 mt-1 tabular-nums">
              {promotableStudents.length} Students
            </div>
            <span className="text-[11px] text-emerald-700 block mt-0.5">
              +1 Class higher & fees auto-updated
            </span>
          </div>

          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl">
            <div className="flex items-center justify-between text-indigo-800 text-xs font-bold">
              <span>10+2 Alumni Graduates</span>
              <GraduationCap className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-900 mt-1 tabular-nums">
              {graduatingAlumni.length} Students
            </div>
            <span className="text-[11px] text-indigo-700 block mt-0.5">
              Moved to Alumni with ₹0 fees
            </span>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
            <div className="flex items-center justify-between text-amber-800 text-xs font-bold">
              <span>Held Back (Pending Fees)</span>
              <ShieldAlert className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-900 mt-1 tabular-nums">
              {defaulterStudents.length} Students
            </div>
            <span className="text-[11px] text-amber-700 block mt-0.5">
              Must clear pending fees before promotion
            </span>
          </div>
        </div>

        {/* Rules explanation */}
        <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs space-y-1.5 text-neutral-600">
          <div className="font-bold text-neutral-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Automatic Session Transition Rules:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-neutral-600">
            <li><strong>Class Progression:</strong> Class 8th → 9th (₹2,000/mo), 9th → 10th (₹2,500/mo), 10th → +1 (₹3,000/mo), +1 → +2 (₹3,500/mo).</li>
            <li><strong>Class 10+2 Graduates:</strong> Students in 12th/10+2 are marked as <em>Alumni</em> and monthly fees set to ₹0.</li>
            <li><strong>Fee Clearance Enforcement:</strong> Students with uncleared fees are held back in the previous session until dues are paid.</li>
            <li><strong>Notes Archival:</strong> Previous session study notes and PDF materials are archived safely to start the new academic year fresh while retaining full restore capabilities.</li>
          </ul>
        </div>

        {/* Action Form */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-neutral-700 whitespace-nowrap">
              Target New Academic Year:
            </label>
            <input
              type="text"
              placeholder="e.g. 2027-2028"
              value={nextYearInput}
              onChange={(e) => setNextYearInput(e.target.value)}
              className="px-3 py-1.5 font-mono text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>

          <button
            type="button"
            disabled={isTransitioning}
            onClick={handleRolloverSession}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm cursor-pointer transition-colors disabled:opacity-50"
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>{isTransitioning ? 'Transitioning Session...' : 'Roll Over Academic Year & Promote'}</span>
          </button>
        </div>

        {/* Transition Outcome Summary */}
        {transitionOutcome && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Academic Year Transition Completed Successfully!</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-neutral-700">
              <div><strong>Promoted:</strong> {transitionOutcome.promoted?.length || 0} students</div>
              <div><strong>Alumni:</strong> {transitionOutcome.graduatedAlumni?.length || 0} students</div>
              <div><strong>Held Back (Due fees):</strong> {transitionOutcome.blockedDueToFees?.length || 0} students</div>
            </div>
            {transitionOutcome.blockedDueToFees?.length > 0 && (
              <div className="text-[11px] text-amber-800 pt-1">
                Notice: The following students have outstanding dues and remain in their current class until fees are cleared: {transitionOutcome.blockedDueToFees.map(s => `${s.name} (₹${s.pendingFee})`).join(', ')}.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Database Backup & Restore Section */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
          <Database className="w-5 h-5 text-neutral-700" />
          <div>
            <h2 className="text-base font-bold text-neutral-900">Database Backup & Recovery</h2>
            <p className="text-xs text-neutral-500">
              Export complete snapshots or restore from previously downloaded JSON backups
            </p>
          </div>
        </div>

        <p className="text-xs text-neutral-600 leading-relaxed">
          Your student records, batch schedules, weekly tests, and fee receipts are stored securely in MongoDB.
          You can download a complete JSON backup or export Excel-friendly CSVs anytime.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 p-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-800 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-red-600" />
            <span>Download Full Backup (JSON)</span>
          </button>

          <label className="flex items-center justify-center gap-2 p-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-800 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-red-600" />
            <span>Restore From JSON Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>

        {/* Reset Demo Data */}
        <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-neutral-800 block">
              Reset Demo Sample Data
            </span>
            <span className="text-[11px] text-neutral-500 block">
              Restore the initial 6 VMC students, 5 batches, and realistic fee payment records.
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'Are you sure you want to reset all data back to the sample demo dataset? Any custom records will be overwritten.'
                )
              ) {
                onResetAllData && onResetAllData()
              }
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>
    </div>
  )
}
