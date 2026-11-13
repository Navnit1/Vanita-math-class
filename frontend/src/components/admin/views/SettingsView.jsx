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
  AlertTriangle
} from 'lucide-react'

export default function SettingsView({
  settings = {},
  onSaveSettings,
  onResetAllData,
  students = [],
  batches = [],
  payments = [],
  onImportAllData,
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
