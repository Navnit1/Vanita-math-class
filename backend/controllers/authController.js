import crypto from 'crypto'
import User from '../models/User.js'
import Student from '../models/Student.js'
import ContactInquiry from '../models/ContactInquiry.js'
import {
  createError, generateAccessToken, generateRefreshToken, sendResponse
} from '../utils/helpers.js'
import { generateStudentCredentials } from '../utils/idGenerator.js'
import { recordAudit } from '../utils/auditLog.js'
import logger from '../utils/logger.js'
import { sendPasswordResetOtpEmail, sendEmail, isEmailConfigured, getEmailStatus } from '../services/emailService.js'
import { notifyAdminWhatsApp, buildAdminNewRegistrationAlert } from '../services/whatsappService.js'
import { getStandardMonthlyFee, normalizeStandard } from '../config/pricing.js'

export const login = async (req, res, next) => {
  try {
    const { identifier, email, password } = req.body
    const loginId = (identifier || email || '').trim()
    if (!loginId || !password) return next(createError(400, 'Login ID and password are required'))

    // Allow login via email, username, or Student ID
    let user = null
    const looksLikeEmail = loginId.includes('@')
    if (looksLikeEmail) {
      user = await User.findOne({ email: loginId.toLowerCase() }).select('+password +refreshToken')
    } else {
      user = await User.findOne({ username: loginId.toLowerCase() }).select('+password +refreshToken')
      if (!user) {
        // Try matching by Student ID (case-insensitive, e.g. STD8-2026-001)
        const student = await Student.findOne({ studentId: new RegExp(`^${loginId}$`, 'i') })
        if (student) {
          user = await User.findById(student.userId).select('+password +refreshToken')
        }
      }
    }

    if (!user || !(await user.comparePassword(password))) {
      return next(createError(401, 'Invalid credentials'))
    }

    if (user.status === 'inactive') return next(createError(403, 'Account is deactivated. Contact admin.'))
    if (user.status === 'pending') return next(createError(403, 'Account pending approval. Contact admin.'))

    const accessToken = generateAccessToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    user.refreshToken = refreshToken
    user.lastLogin = new Date()
    await user.save({ validateBeforeSave: false })

    // Get role-specific profile (admin or student only)
    let profile = null
    if (user.role === 'student') {
      profile = await Student.findOne({ userId: user._id })
    }

    logger.info(`User logged in: ${user.email || user.username} [${user.role}]`)

    sendResponse(res, 200, {
      user: { ...user.toJSON(), profile, mustChangePassword: Boolean(user.mustChangePassword) },
      accessToken,
      refreshToken,
    }, 'Login successful')

    recordAudit({ action: 'auth.login', user, description: `${user.name} logged in`, req })
  } catch (err) {
    next(err)
  }
}

export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, class: studentClass, batch, parentName, parentPhone, address, school } = req.body

    const cleanEmail = (email || '').trim().toLowerCase()
    const cleanPhone = (phone || '').trim()

    if (!name || !cleanEmail || !cleanPhone || !password) {
      return next(createError(400, 'Student name, email, phone number, and password are required.'))
    }

    const existingUser = await User.findOne({ email: cleanEmail })
    if (existingUser) return next(createError(409, 'This email address is already registered. Please log in or contact the institute.'))

    const existingStudentPhone = await Student.findOne({ phone: cleanPhone })
    if (existingStudentPhone) {
      return next(createError(409, 'This phone number is already registered for an existing student. Please log in or contact the institute.'))
    }

    const targetClass = normalizeStandard(studentClass || '8th')
    const authoritativeMonthlyFee = getStandardMonthlyFee(targetClass)
    const targetBatch = batch || 'Evening'
    const { studentId, username } = await generateStudentCredentials(name, targetClass)

    // Students are created in 'pending' status — they cannot activate themselves without admin approval!
    const user = await User.create({
      name,
      email: cleanEmail,
      phone: cleanPhone,
      username,
      password,
      role: 'student',
      status: 'pending',
      mustChangePassword: false,
    })

    const student = await Student.create({
      studentId,
      userId: user._id,
      fullName: name,
      email: cleanEmail,
      phone: cleanPhone,
      class: targetClass,
      batch: targetBatch,
      school: (school || '').trim(),
      parentName: (parentName || '').trim(),
      parentPhone: (parentPhone || cleanPhone).trim(),
      address: (address || '').trim(),
      status: 'inactive', // inactive until admin approves admission
      feeStatus: 'pending',
      monthlyFee: authoritativeMonthlyFee,
      totalFee: authoritativeMonthlyFee * 10,
      paidFee: 0,
      discount: 0,
      feePlan: 'monthly',
    })

    // Deliberate, documented 1:1 mapping: Create linked ContactInquiry record
    // so the registration is immediately visible in the Admin Enquiries section
    await ContactInquiry.create({
      name,
      parentName: (parentName || '').trim(),
      email: cleanEmail,
      phone: cleanPhone,
      class: targetClass,
      school: (school || '').trim(),
      preferredBatch: targetBatch,
      message: `[Online Student Registration] Roll Number: ${studentId}. Account created with status pending, awaiting admin approval.`,
      status: 'new',
      enrolledStudentId: student._id,
    })

    logger.info(`New student registration requested: ${cleanEmail} (${name}), Roll: ${studentId}`)

    // 1. Notify Administrator via WhatsApp Cloud API (non-blocking)
    const adminWhatsAppAlert = buildAdminNewRegistrationAlert({
      name,
      studentId,
      studentClass: targetClass,
      batch: targetBatch,
      phone: cleanPhone,
      parentName: parentName || '',
      parentPhone: parentPhone || cleanPhone,
      email: cleanEmail,
    })
    notifyAdminWhatsApp(adminWhatsAppAlert).catch(err => {
      logger.error('Failed to dispatch admin WhatsApp alert for new registration:', err.message)
    })

    // 2. Notify Administrator via Email if configured (non-blocking)
    if (isEmailConfigured()) {
      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.EMAIL_USER
      if (adminEmail) {
        sendEmail({
          to: adminEmail,
          subject: `🔔 New Student Registration: ${name} (Class ${targetClass}, Roll: ${studentId})`,
          html: `<h3>New Online Student Registration</h3>
                 <p>A new prospective student has registered online and requires admission approval before logging in:</p>
                 <p><strong>Student Name:</strong> ${name}</p>
                 <p><strong>Roll Number:</strong> ${studentId}</p>
                 <p><strong>Class & Batch:</strong> Class ${targetClass} (${targetBatch})</p>
                 <p><strong>Student Phone:</strong> ${cleanPhone}</p>
                 <p><strong>Parent / Guardian:</strong> ${parentName || 'Not specified'} (${parentPhone || cleanPhone})</p>
                 <p><strong>Email:</strong> ${cleanEmail}</p>
                 <p><strong>School:</strong> ${school || 'Not specified'}</p>
                 <p><a href="${(process.env.FRONTEND_URL || 'https://vanita-math-class.vercel.app').replace(/\/+$/, '')}/admin/inquiries">Review in Admin Portal</a></p>`,
        }).catch(err => logger.error('Failed to dispatch admin email alert for registration:', err.message))
      }
    }

    sendResponse(res, 201, { studentId, username }, 'Registration submitted successfully. The administrator will review and approve your account before you can log in.')
  } catch (err) {
    next(err)
  }
}

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body
    if (!token) return next(createError(400, 'Refresh token required'))

    const user = await User.findOne({ refreshToken: token }).select('+refreshToken')
    if (!user) return next(createError(401, 'Invalid refresh token'))

    const accessToken = generateAccessToken(user._id)
    const newRefreshToken = generateRefreshToken(user._id)

    user.refreshToken = newRefreshToken
    await user.save({ validateBeforeSave: false })

    sendResponse(res, 200, { accessToken, refreshToken: newRefreshToken }, 'Token refreshed')
  } catch (err) {
    next(err)
  }
}

export const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null }, { validateBeforeSave: false })
    sendResponse(res, 200, null, 'Logged out successfully')
  } catch (err) {
    next(err)
  }
}

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    let profile = null
    if (user.role === 'student') profile = await Student.findOne({ userId: user._id })
    sendResponse(res, 200, { ...user.toJSON(), profile, mustChangePassword: Boolean(user.mustChangePassword) })
  } catch (err) {
    next(err)
  }
}

/**
 * PHASE 11: Free Email 6-Digit OTP Password Recovery
 */
export const requestPasswordResetOtp = async (req, res, next) => {
  try {
    const { identifier } = req.body
    const loginId = (identifier || '').trim().toLowerCase()
    if (!loginId) return next(createError(400, 'Please provide your registered email or username'))

    // Find by email or username
    let user = await User.findOne({
      $or: [{ email: loginId }, { username: loginId }],
    }).select('+resetPasswordOtpHash +resetPasswordOtpExpires +resetPasswordOtpAttempts +lastOtpSentAt')

    if (!user && !loginId.includes('@')) {
      const student = await Student.findOne({ studentId: new RegExp(`^${loginId}$`, 'i') })
      if (student) {
        user = await User.findById(student.userId).select('+resetPasswordOtpHash +resetPasswordOtpExpires +resetPasswordOtpAttempts +lastOtpSentAt')
      }
    }

    // Generic safe response to prevent account enumeration
    const genericSuccess = 'If that account exists with a registered email, a 6-digit recovery code has been sent. Please check your inbox and spam folder.'

    if (!user || !user.email || user.email.endsWith('@vanitamaths.local')) {
      return sendResponse(res, 200, { emailSent: false }, genericSuccess)
    }

    // Rate limit: 60 seconds cooldown between OTP requests
    if (user.lastOtpSentAt && Date.now() - new Date(user.lastOtpSentAt).getTime() < 60 * 1000) {
      return next(createError(429, 'Please wait 60 seconds before requesting another code.'))
    }

    // Generate cryptographically secure 6-digit OTP
    const otp = String(crypto.randomInt(100000, 999999))
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex')

    user.resetPasswordOtpHash = otpHash
    user.resetPasswordOtpExpires = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry
    user.resetPasswordOtpAttempts = 0
    user.lastOtpSentAt = new Date()
    await user.save({ validateBeforeSave: false })

    try {
      await sendPasswordResetOtpEmail(user.email, otp)
    } catch (mailErr) {
      logger.error('Failed to dispatch OTP email:', mailErr.message)
    }

    sendResponse(res, 200, { emailSent: true }, genericSuccess)
  } catch (err) {
    next(err)
  }
}

export const verifyOtpAndResetPassword = async (req, res, next) => {
  try {
    const { identifier, otp, newPassword } = req.body
    if (!identifier || !otp || !newPassword) {
      return next(createError(400, 'Identifier, 6-digit OTP code, and new password are required'))
    }

    if (newPassword.length < 6) {
      return next(createError(400, 'New password must be at least 6 characters'))
    }

    const loginId = identifier.trim().toLowerCase()
    let user = await User.findOne({
      $or: [{ email: loginId }, { username: loginId }],
    }).select('+password +resetPasswordOtpHash +resetPasswordOtpExpires +resetPasswordOtpAttempts')

    if (!user && !loginId.includes('@')) {
      const student = await Student.findOne({ studentId: new RegExp(`^${loginId}$`, 'i') })
      if (student) {
        user = await User.findById(student.userId).select('+password +resetPasswordOtpHash +resetPasswordOtpExpires +resetPasswordOtpAttempts')
      }
    }

    if (!user || !user.resetPasswordOtpHash || !user.resetPasswordOtpExpires) {
      return next(createError(400, 'Invalid or expired OTP code. Please request a new code.'))
    }

    if (new Date() > user.resetPasswordOtpExpires) {
      user.resetPasswordOtpHash = undefined
      user.resetPasswordOtpExpires = undefined
      await user.save({ validateBeforeSave: false })
      return next(createError(400, 'Verification code has expired. Codes are valid for 5 minutes only.'))
    }

    if (user.resetPasswordOtpAttempts >= 3) {
      user.resetPasswordOtpHash = undefined
      user.resetPasswordOtpExpires = undefined
      await user.save({ validateBeforeSave: false })
      return next(createError(400, 'Too many incorrect attempts. Please request a new verification code.'))
    }

    const providedHash = crypto.createHash('sha256').update(String(otp).trim()).digest('hex')
    if (providedHash !== user.resetPasswordOtpHash) {
      user.resetPasswordOtpAttempts = (user.resetPasswordOtpAttempts || 0) + 1
      await user.save({ validateBeforeSave: false })
      const remaining = 3 - user.resetPasswordOtpAttempts
      return next(createError(400, `Incorrect code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Code invalidated.'}`))
    }

    // Success: single-use, clear OTP immediately and set new password
    user.password = newPassword
    user.resetPasswordOtpHash = undefined
    user.resetPasswordOtpExpires = undefined
    user.resetPasswordOtpAttempts = 0
    user.mustChangePassword = false
    await user.save()

    logger.info(`Password successfully reset via OTP for user: ${user.username || user.email}`)
    sendResponse(res, 200, null, 'Password reset successfully! You can now log in with your new password.')
  } catch (err) {
    next(err)
  }
}

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id).select('+password')

    if (!(await user.comparePassword(currentPassword))) {
      return next(createError(401, 'Current password is incorrect'))
    }

    if (newPassword.length < 6) {
      return next(createError(400, 'New password must be at least 6 characters'))
    }

    user.password = newPassword
    user.mustChangePassword = false
    await user.save()
    sendResponse(res, 200, null, 'Password changed successfully')
  } catch (err) {
    next(err)
  }
}

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body
    const updates = { name, phone }
    if (req.file) updates.profilePhoto = req.file.path

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
    sendResponse(res, 200, user, 'Profile updated successfully')
  } catch (err) {
    next(err)
  }
}
