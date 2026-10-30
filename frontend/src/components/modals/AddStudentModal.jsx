import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal, FormField, Select } from '@/components/ui'
import { studentService } from '@/services'
import { CLASS_PRICING, normalizeStandard } from '@/config/pricing'
import { formatCurrency } from '@/lib/utils'
import { PlusCircle, Loader2, KeyRound, Copy, Check, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

const CLASSES = ['8th', '9th', '10th', '+1', '+2']
const BATCHES = ['Evening', 'Morning', 'Weekend']

export default function AddStudentModal({ isOpen, onClose, initialData = null }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [studentClass, setStudentClass] = useState('10th')
  const [batch, setBatch] = useState('Evening')
  const [school, setSchool] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [discount, setDiscount] = useState('0')
  const [address, setAddress] = useState('')
  const [credentialsModal, setCredentialsModal] = useState(null)
  const [copied, setCopied] = useState(false)

  const qc = useQueryClient()

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || initialData.fullName || '')
      setEmail(initialData.email || '')
      setPhone(initialData.phone || '')
      setStudentClass(normalizeStandard(initialData.class || '10th'))
      setBatch(initialData.preferredBatch || initialData.batch || 'Evening')
      setSchool(initialData.school || '')
      setParentName(initialData.parentName || '')
      setParentPhone(initialData.parentPhone || initialData.phone || '')
      setAddress(initialData.address || '')
    }
  }, [initialData])

  const authoritativeFee = CLASS_PRICING[studentClass] || 2500
  const netFee = Math.max(0, authoritativeFee * 10 - Number(discount || 0))

  const createMutation = useMutation({
    mutationFn: studentService.create,
    onSuccess: (res) => {
      qc.invalidateQueries(['students'])
      qc.invalidateQueries(['admin-dashboard'])
      qc.invalidateQueries(['inquiries'])
      toast.success('Student enrolled successfully!')
      if (res.credentials) {
        setCredentialsModal(res.credentials)
      } else {
        onClose()
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to enroll student')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Student name is required')
      return
    }
    if (!phone.trim()) {
      toast.error('Student phone number is required')
      return
    }

    createMutation.mutate({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim(),
      class: studentClass,
      batch,
      school: school.trim(),
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim() || phone.trim(),
      address: address.trim(),
      discount: Number(discount || 0),
      feePlan: 'monthly',
      academicYear: String(new Date().getFullYear()),
    })
  }

  const copyCreds = () => {
    if (!credentialsModal) return
    const text = `Vanita Math Classes Login Credentials\nRoll Number: ${credentialsModal.studentId}\nUsername: ${credentialsModal.username}\nTemporary Password: ${credentialsModal.password || credentialsModal.temporaryPassword}\nPortal: ${window.location.origin}/login`
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Credentials copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Modal isOpen={isOpen && !credentialsModal} onClose={onClose} title="Enroll New Student" size="lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-[#FFF5F5] border border-[#FFCCD0] text-[#C90019] text-xs p-3 rounded-xl flex items-start gap-2.5 font-medium">
            <KeyRound className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              A unique Roll Number and temporary password will be automatically assigned. Authoritative monthly fees are centrally enforced by standard.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Student Full Name" required>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jaspreet Singh"
                className="input"
                required
              />
            </FormField>

            <FormField label="Student Mobile Number" required>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="input"
                required
              />
            </FormField>

            <FormField label="Standard / Class" required>
              <Select value={studentClass} onChange={(e) => setStudentClass(e.target.value)}>
                {CLASSES.map((c) => (
                  <option key={c} value={c}>
                    Class {c} ({formatCurrency(CLASS_PRICING[c])}/mo)
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Batch Timing" required>
              <Select value={batch} onChange={(e) => setBatch(e.target.value)}>
                {BATCHES.map((b) => (
                  <option key={b} value={b}>
                    {b} Batch
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Parent / Guardian Name" required>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Parent full name"
                className="input"
                required
              />
            </FormField>

            <FormField label="Parent Phone Number" required>
              <input
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="Parent mobile number"
                className="input"
                required
              />
            </FormField>

            <FormField label="Email Address (Optional)">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="input"
              />
            </FormField>

            <FormField label="School Name (Optional)">
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="e.g. St. Joseph Convent School"
                className="input"
              />
            </FormField>
          </div>

          <FormField label="Address / Locality (Bathinda)">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. #302, Phase-II, Vishal Nagar, Bathinda"
              className="input"
            />
          </FormField>

          {/* Pricing Confirmation Strip */}
          <div className="p-3 bg-[#FAFAFA] border border-[#D9DDE3] rounded-xl flex flex-wrap items-center justify-between text-xs gap-2">
            <div>
              <span className="text-[#64748B]">Assigned Monthly Fee: </span>
              <strong className="text-[#171717]">{formatCurrency(authoritativeFee)} / month</strong>
            </div>
            <div>
              <span className="text-[#64748B]">Annual Academic Obligation: </span>
              <strong className="text-[#C90019]">{formatCurrency(netFee)}</strong>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-[#D9DDE3]">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn btn-primary btn-sm font-bold shadow-red-glow flex items-center gap-1.5"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enrolling…
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" /> Enroll Student & Generate Credentials
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Credentials Output Modal */}
      {credentialsModal && (
        <Modal isOpen={Boolean(credentialsModal)} onClose={() => { setCredentialsModal(null); onClose(); }} title="Student Credentials Generated" size="sm">
          <div className="p-6 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-2 text-[#059669]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-[#171717]">Admission Confirmed</h3>
              <p className="text-xs text-[#64748B] mt-0.5">Please share login credentials with the student.</p>
            </div>

            <div className="bg-[#F3F4F6] border border-[#D9DDE3] rounded-xl p-3.5 space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-[#D9DDE3]">
                <span className="text-[#64748B]">Roll Number:</span>
                <strong className="text-[#171717]">{credentialsModal.studentId}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#D9DDE3]">
                <span className="text-[#64748B]">Username:</span>
                <strong className="text-[#171717]">{credentialsModal.username}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#64748B]">Temp Password:</span>
                <strong className="text-[#C90019]">{credentialsModal.password || credentialsModal.temporaryPassword}</strong>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyCreds}
                className="btn btn-primary flex-1 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy Credentials'}
              </button>
              <button
                type="button"
                onClick={() => { setCredentialsModal(null); onClose(); }}
                className="btn btn-secondary btn-sm text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
