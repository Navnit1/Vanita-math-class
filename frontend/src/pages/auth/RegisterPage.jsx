import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authService } from '@/services/authService'
import { GraduationCap, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { FormField, Select } from '@/components/ui'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Confirm your password'),
  class: z.string().min(1, 'Select your standard'),
  batch: z.string().min(1, 'Select your batch'),
  address: z.string().min(5, 'Address is required'),
  parentName: z.string().min(2, 'Parent name is required'),
  parentPhone: z.string().min(10, 'Enter parent phone number'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

const CLASSES = ['8th', '9th', '10th', '11th', '12th']
const BATCHES = ['Morning', 'Evening', 'Weekend']

export default function RegisterPage() {
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    try {
      const { confirmPassword, ...payload } = data
      await authService.register(payload)
      setDone(true)
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      if (msg.includes('Email')) setError('email', { message: msg })
      else setError('root', { message: msg })
    }
  }

  if (done) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Registration submitted!</h2>
        <p className="text-slate-500 text-sm mt-2">Your account request has been sent to the admin. You'll receive access once verified.</p>
        <Link to="/login" className="btn btn-primary mt-6 inline-flex">Back to login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
       <Link to="/" className="flex items-center gap-2 mb-8 w-fit">
  <img src="/fab2.jpeg" alt="Vanita Math Classes logo" className="w-7 h-7 rounded-lg object-contain flex-shrink-0" />
  <span className="font-bold text-slate-900 text-lg">Vanita Math Classes</span>
</Link>

        <div className="card p-8">
          <h1 className="text-xl font-bold text-slate-900">Request Access</h1>
          <p className="text-sm text-slate-500 mt-1">Fill in your details. Admin will verify and activate your account.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {errors.root && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{errors.root.message}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Full Name" error={errors.name?.message} required>
                <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Your full name" />
              </FormField>
              <FormField label="Email Address" error={errors.email?.message} required>
                <input {...register('email')} type="email" className={`input ${errors.email ? 'input-error' : ''}`} placeholder="you@example.com" />
              </FormField>
              <FormField label="Phone Number" error={errors.phone?.message} required>
                <input {...register('phone')} type="tel" className={`input ${errors.phone ? 'input-error' : ''}`} placeholder="10-digit mobile number" />
              </FormField>
              <FormField label="Password" error={errors.password?.message} required>
                <div className="relative">
                  <input {...register('password')} type={showPw ? 'text' : 'password'} className={`input pr-10 ${errors.password ? 'input-error' : ''}`} placeholder="Min 6 characters" />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FormField>
              <FormField label="Confirm Password" error={errors.confirmPassword?.message} required>
                <div className="relative">
                  <input {...register('confirmPassword')} type={showConfirmPw ? 'text' : 'password'} className={`input pr-10 ${errors.confirmPassword ? 'input-error' : ''}`} placeholder="Re-enter password" />
                  <button type="button" onClick={() => setShowConfirmPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FormField>
              <FormField label="Standard" error={errors.class?.message} required>
                <Select {...register('class')} className={errors.class ? 'input-error' : ''}>
                  <option value="">Select standard</option>
                  {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </FormField>
              <FormField label="Preferred Batch" error={errors.batch?.message} required>
                <Select {...register('batch')} className={errors.batch ? 'input-error' : ''}>
                  <option value="">Select batch</option>
                  {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </Select>
              </FormField>
              <FormField label="Address" error={errors.address?.message} required className="sm:col-span-2">
                <input {...register('address')} className={`input ${errors.address ? 'input-error' : ''}`} placeholder="House no, street, city" />
              </FormField>
              <FormField label="Parent / Guardian Name" error={errors.parentName?.message} required>
                <input {...register('parentName')} className={`input ${errors.parentName ? 'input-error' : ''}`} placeholder="Parent full name" />
              </FormField>
              <FormField label="Parent Phone" error={errors.parentPhone?.message} required>
                <input {...register('parentPhone')} type="tel" className={`input ${errors.parentPhone ? 'input-error' : ''}`} placeholder="Parent mobile number" />
              </FormField>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg w-full mt-2">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : 'Submit Registration'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account? <Link to="/login" className="text-primary-600 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
