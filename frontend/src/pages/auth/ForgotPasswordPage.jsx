import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'
import { KeyRound, Mail, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Eye, EyeOff, ShieldCheck, Phone } from 'lucide-react'
import { FormField } from '@/components/ui'
import AuthHeader from '@/components/layout/AuthHeader'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Request OTP, 2: Enter OTP & New Password
  const [identifier, setIdentifier] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [cooldown, setCooldown] = useState(0)

  // 60-second resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown(c => c - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // Step 1: Request 6-digit OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault()
    if (!identifier.trim()) {
      setErrorMsg('Please enter your email, username, or Student ID')
      return
    }

    setErrorMsg('')
    setLoading(true)

    try {
      await authService.sendOtp(identifier.trim())
      toast.success('If registered, a 6-digit verification code has been sent!')
      setStep(2)
      setCooldown(60)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Could not send verification code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP & Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!otp || otp.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code sent to your email.')
      return
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      await authService.verifyOtpAndReset(identifier.trim(), otp.trim(), newPassword)
      toast.success('Password reset successfully! Please log in.')
      navigate('/login')
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to verify code. Please check your code or request a new one.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between">
      <AuthHeader subtitle="Secure Account Recovery" currentPortal="student" />

      {/* Main Form */}
      <div className="max-w-md mx-auto w-full my-auto py-8">
        <div className="bg-white border border-[#D9DDE3] rounded-2xl shadow-card p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#FFF5F5] border border-[#FFCCD0] text-[#E50914] mb-3">
              {step === 1 ? <Mail className="w-6 h-6 text-[#C90019]" /> : <KeyRound className="w-6 h-6 text-[#C90019]" />}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#171717] tracking-tight">
              {step === 1 ? 'Password Recovery' : 'Enter Verification Code'}
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1.5">
              {step === 1
                ? 'Enter your registered email, username, or Student ID to receive a 6-digit OTP code.'
                : `We sent a single-use 6-digit code to your registered email. Codes are valid for 5 minutes.`}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 flex items-start gap-2 bg-[#FFF5F5] border border-[#FFCCD0] text-[#C90019] text-xs sm:text-sm p-3.5 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <FormField label="Email, Username, or Student ID" required>
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="e.g. rahul@example.com or STD8-2026-001"
                  className="input"
                  autoFocus
                />
              </FormField>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary py-3 font-bold text-sm tracking-wide shadow-red-glow"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    Sending Code…
                  </>
                ) : (
                  'Send 6-Digit OTP Code'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="label">
                  6-Digit Verification Code <span className="text-[#E50914]">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="input text-center font-mono text-2xl font-bold tracking-widest text-[#C90019]"
                  autoFocus
                />
                <div className="flex justify-between items-center mt-1 text-xs text-[#64748B]">
                  <span>Expires in 5 minutes</span>
                  {cooldown > 0 ? (
                    <span>Resend in {cooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={loading}
                      className="text-[#E50914] font-semibold hover:underline"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </div>

              <FormField label="New Password" required>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FormField>

              <FormField label="Confirm New Password" required>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="input"
                />
              </FormField>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary py-3 font-bold text-sm tracking-wide shadow-red-glow mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    Verifying & Updating…
                  </>
                ) : (
                  'Reset Password & Login'
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs text-[#64748B] hover:text-[#171717] pt-2"
              >
                Use a different email / ID
              </button>
            </form>
          )}

          {/* Admin Assisted Recovery Notice */}
          <div className="mt-6 pt-5 border-t border-[#D9DDE3] bg-[#FAFAFA] -mx-6 -mb-6 p-4 rounded-b-2xl border-t">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#E50914] shrink-0 mt-0.5" />
              <div className="text-xs text-[#64748B] leading-relaxed">
                <p className="font-semibold text-[#171717]">Students without verified email:</p>
                <p className="mt-0.5">
                  If you do not have an email linked to your account, please contact{' '}
                  <strong>Vanita Rani Gupta</strong> directly at{' '}
                  <a href="tel:9815962612" className="text-[#E50914] font-semibold underline">
                    98159-62612
                  </a>{' '}
                  for admin-assisted password reset.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-[#64748B] pt-4">
        &copy; {new Date().getFullYear()} Vanita Math Classes · Bathinda
      </footer>
    </div>
  )
}
