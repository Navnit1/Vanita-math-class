import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authService } from '@/services/authService'
import { Eye, EyeOff, CheckCircle2, ArrowLeft, Loader2, Phone, MapPin, ShieldAlert } from 'lucide-react'
import { FormField, Select } from '@/components/ui'
import AuthHeader from '@/components/layout/AuthHeader'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(10, 'Enter a valid 10-digit mobile number'),
  class: z.string().min(1, 'Select your class / standard'),
  batch: z.string().min(1, 'Select your preferred batch'),
  school: z.string().min(2, 'School name is required'),
  parentName: z.string().min(2, 'Parent / Guardian name is required'),
  parentPhone: z.string().min(10, 'Enter parent 10-digit mobile number'),
  address: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

const CLASSES = ['8th', '9th', '10th', '+1', '+2']
const BATCHES = ['Evening', 'Morning', 'Weekend']

export default function RegisterPage() {
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const [done, setDone] = useState(false)
  const [createdStudent, setCreatedStudent] = useState(null)

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      class: '10th',
      batch: 'Evening',
    },
  })

  const onSubmit = async (data) => {
    try {
      const { confirmPassword, ...payload } = data
      const res = await authService.register(payload)
      setCreatedStudent(res.data)
      setDone(true)
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      if (msg.toLowerCase().includes('email')) setError('email', { message: msg })
      else setError('root', { message: msg })
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white border border-[#D9DDE3] rounded-2xl shadow-card p-6 sm:p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4 text-[#059669]">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#171717]">Registration Received!</h2>
          <p className="text-sm text-[#64748B] mt-2">
            Your admission request has been saved with Student ID:
          </p>
          <div className="my-4 p-3 bg-[#F3F4F6] border border-[#D9DDE3] rounded-xl font-mono font-bold text-lg text-[#C90019]">
            {createdStudent?.studentId || 'Pending Approval'}
          </div>
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-left space-y-1 mb-6">
            <p className="font-bold">Next Steps:</p>
            <p>1. Administrator <strong>Vanita Rani Gupta</strong> will verify and activate your student account.</p>
            <p>2. Once approved, you will be able to log in to access notes, tests, and fees.</p>
            <p>3. For immediate assistance, call <strong>98159-62612</strong>.</p>
          </div>
          <Link to="/login" className="btn btn-primary w-full py-2.5">
            Return to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between">
      <AuthHeader subtitle="New Student Registration Request" currentPortal="student" />

      <div className="max-w-2xl mx-auto w-full my-auto py-8">
        <div className="bg-white border border-[#D9DDE3] rounded-2xl shadow-card p-6 sm:p-8">
          <div className="mb-6">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF5F5] text-[#C90019] border border-[#FFCCD0] mb-2 uppercase">
              Admissions 2026–2027
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#171717] tracking-tight">
              Student Registration Request
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              Mathematics Tuition for Classes 8th, 9th, 10th, +1 and +2. All accounts are verified and approved by the institute.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errors.root && (
              <div className="bg-[#FFF5F5] border border-[#FFCCD0] text-[#C90019] text-xs sm:text-sm p-3.5 rounded-lg font-medium">
                {errors.root.message}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Student Full Name" error={errors.name?.message} required>
                <input {...register('name')} placeholder="e.g. Jaspreet Singh" className={`input ${errors.name ? 'input-error' : ''}`} />
              </FormField>

              <FormField label="Class / Standard" error={errors.class?.message} required>
                <Select {...register('class')}>
                  {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                </Select>
              </FormField>

              <FormField label="Preferred Batch" error={errors.batch?.message} required>
                <Select {...register('batch')}>
                  {BATCHES.map(b => <option key={b} value={b}>{b} Batch</option>)}
                </Select>
              </FormField>

              <FormField label="School Name" error={errors.school?.message} required>
                <input {...register('school')} placeholder="e.g. St. Joseph Convent School" className={`input ${errors.school ? 'input-error' : ''}`} />
              </FormField>

              <FormField label="Student Mobile" error={errors.phone?.message} required>
                <input {...register('phone')} placeholder="10-digit mobile number" className={`input ${errors.phone ? 'input-error' : ''}`} />
              </FormField>

              <FormField label="Email Address" error={errors.email?.message} required>
                <input {...register('email')} type="email" placeholder="student@example.com" className={`input ${errors.email ? 'input-error' : ''}`} />
              </FormField>

              <FormField label="Parent / Guardian Name" error={errors.parentName?.message} required>
                <input {...register('parentName')} placeholder="Parent name" className={`input ${errors.parentName ? 'input-error' : ''}`} />
              </FormField>

              <FormField label="Parent Mobile Number" error={errors.parentPhone?.message} required>
                <input {...register('parentPhone')} placeholder="10-digit parent mobile" className={`input ${errors.parentPhone ? 'input-error' : ''}`} />
              </FormField>
            </div>

            <FormField label="Address / Locality (Bathinda)" hint="Optional: helps assign appropriate batch timing">
              <input {...register('address')} placeholder="e.g. Phase-II, Model Town / Vishal Nagar" className="input" />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <FormField label="Create Password" error={errors.password?.message} required>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FormField>

              <FormField label="Confirm Password" error={errors.confirmPassword?.message} required>
                <input
                  {...register('confirmPassword')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                />
              </FormField>
            </div>

            <div className="p-3 bg-[#F3F4F6] border border-[#D9DDE3] rounded-xl text-xs text-[#64748B] flex items-start gap-2 mt-4">
              <ShieldAlert className="w-4 h-4 text-[#E50914] shrink-0 mt-0.5" />
              <span>
                By registering, you request admission into Vanita Math Classes. Accounts are active once approved by faculty.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn btn-primary py-3 font-bold text-sm tracking-wide shadow-red-glow mt-2"
            >
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Submitting Request…</> : 'Submit Registration Request'}
            </button>
          </form>

          <p className="text-center text-xs text-[#64748B] mt-5">
            Already have an active account?{' '}
            <Link to="/login" className="font-bold text-[#E50914] hover:underline">
              Sign In Here
            </Link>
          </p>
        </div>
      </div>

      <footer className="text-center text-xs text-[#64748B] pt-4">
        Vanita Math Classes · #302, Phase-II, Vishal Nagar, Bathinda · Phone: 98159-62612
      </footer>
    </div>
  )
}
