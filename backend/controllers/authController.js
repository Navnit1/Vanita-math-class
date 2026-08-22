import crypto from 'crypto'
import User from '../models/User.js'
import Student from '../models/Student.js'
import Teacher from '../models/Teacher.js'
import {
  createError, generateAccessToken, generateRefreshToken,
  generatePasswordResetToken, sendResponse
} from '../utils/helpers.js'
import { generateStudentCredentials } from '../utils/idGenerator.js'
import { recordAudit } from '../utils/auditLog.js'
import logger from '../utils/logger.js'
import { sendPasswordResetEmail } from '../utils/mailer.js'

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

    // Get role-specific profile
    let profile = null
    if (user.role === 'student') {
      profile = await Student.findOne({ userId: user._id })
    } else if (user.role === 'teacher') {
      profile = await Teacher.findOne({ userId: user._id })
    }

    logger.info(`User logged in: ${user.email} [${user.role}]`)

    sendResponse(res, 200, {
      user: { ...user.toJSON(), profile },
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
    const { name, email, phone, password, class: studentClass, batch, parentName, parentPhone, address } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) return next(createError(409, 'Email already registered'))

    const { studentId, username } = await generateStudentCredentials(name, studentClass || '0')

    const user = await User.create({ name, email, phone, username, password, role: 'student', status: 'pending' })

    await Student.create({
      studentId, userId: user._id,
      fullName: name, email, phone,
      class: studentClass || 'Not Set',
      batch: batch || 'Not Set',
      parentName, parentPhone, address,
    })

    logger.info(`New student registered: ${email}`)
    sendResponse(res, 201, { studentId, username }, 'Registration successful. Admin will activate your account.')
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
    else if (user.role === 'teacher') profile = await Teacher.findOne({ userId: user._id })
    sendResponse(res, 200, { ...user.toJSON(), profile })
  } catch (err) {
    next(err)
  }
}

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })
    // Always return success to prevent email enumeration
    if (!user) return sendResponse(res, 200, null, 'If that email exists, a reset link has been sent.')

    const { resetToken, hashedToken, expiresAt } = generatePasswordResetToken()
    user.passwordResetToken = hashedToken
    user.passwordResetExpires = expiresAt
    await user.save({ validateBeforeSave: false })

    try {
      await sendPasswordResetEmail(user.email, resetToken)
      logger.info(`Password reset email sent to: ${email}`)
    } catch (mailErr) {
      logger.error(`Failed to send reset email to ${email}: ${mailErr.message}`)
    }

    sendResponse(res, 200, null, 'If that email exists, a reset link has been sent.')
  } catch (err) {
    next(err)
  }
}

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires')

    if (!user) return next(createError(400, 'Invalid or expired reset token'))

    user.password = password
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    sendResponse(res, 200, null, 'Password reset successfully. Please login.')
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
    if (req.file) updates.profilePhoto = `/uploads/profiles/${req.file.filename}`

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
    sendResponse(res, 200, user, 'Profile updated successfully')
  } catch (err) {
    next(err)
  }
}