import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authService } from '@/services/authService'
import { GraduationCap, Loader2, Mail, AlertCircle } from 'lucide-react'
import { FormField } from '@/components/ui'

const schema = z.object({ email: z.string().email('Enter a valid email') })

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting }, getValues } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email }) => {
    setServerError('')
    try {
      await authService.forgotPassword(email)
      setSent(true)
    } catch (err) {
      // Previously an unhandled rejection here left the form stuck without
      // feedback while a global toast fired separately — now it surfaces
      // inline so the user isn't left guessing whether anything happened.
      setServerError(err.response?.data?.message || 'Something went wrong. Please try again.')
    }
  }

  if (sent) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-7 h-7 text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Check your email</h2>
        <p className="text-slate-500 text-sm mt-2">If <strong>{getValues('email')}</strong> is registered, you'll receive a reset link shortly.</p>
        <Link to="/login" className="btn btn-secondary mt-6 inline-flex">Back to login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <GraduationCap className="w-7 h-7 text-primary-600" />
          <span className="font-bold text-slate-900 text-lg">Vanita Math Classes</span>
        </div>
        <div className="card p-8">
          <h1 className="text-xl font-bold text-slate-900">Forgot password</h1>
          <p className="text-sm text-slate-500 mt-1">Enter your email and we'll send a reset link.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {serverError && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}
            <FormField label="Email address" error={errors.email?.message} required>
              <input {...register('email')} type="email" className={`input ${errors.email ? 'input-error' : ''}`} placeholder="you@example.com" autoFocus />
            </FormField>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg w-full">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : 'Send reset link'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-4">
            <Link to="/login" className="text-primary-600 font-medium">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
