import Student from '../models/Student.js'
import User from '../models/User.js'
import Fee from '../models/Fee.js'
import Payment from '../models/Payment.js'
import Attendance from '../models/Attendance.js'
import WeeklyTest from '../models/WeeklyTest.js'
import TestResult from '../models/TestResult.js'
import ContactInquiry from '../models/ContactInquiry.js'
import { createError, sendResponse, paginate } from '../utils/helpers.js'
import { generateStudentCredentials, generateTempPassword } from '../utils/idGenerator.js'
import { recordAudit } from '../utils/auditLog.js'
import logger from '../utils/logger.js'
import {
  sendMetaWhatsAppMessage,
  createDirectWhatsAppLink,
  buildAdmissionCredentialsMessage,
  buildFeeReminderMessage
} from '../services/whatsappService.js'
import { getStandardMonthlyFee, normalizeStandard } from '../config/pricing.js'

/**
 * PHASE 5: Searchable, Filterable Student Directory
 */
export const getAllStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, batch, class: cls, status, feeStatus, month } = req.query
    const filter = {}
    if (status) filter.status = status
    if (batch && batch !== 'All') filter.batch = batch
    if (cls && cls !== 'All') filter.class = cls
    if (feeStatus) filter.feeStatus = feeStatus
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { parentName: { $regex: search, $options: 'i' } },
        { parentPhone: { $regex: search, $options: 'i' } },
        { school: { $regex: search, $options: 'i' } },
      ]
    }

    const { skip, limit: lim } = paginate(null, page, limit)
    const [students, total] = await Promise.all([
      Student.find(filter).sort({ studentId: 1, createdAt: -1 }).skip(skip).limit(lim),
      Student.countDocuments(filter),
    ])

    // Attach linked user account status & password change flags
    const userIds = students.map(s => s.userId).filter(Boolean)
    const users = await User.find({ _id: { $in: userIds } }).select('_id status mustChangePassword lastLogin username')
    const userMap = new Map(users.map(u => [String(u._id), u]))

    const enriched = students.map(s => {
      const obj = s.toObject()
      const u = userMap.get(String(s.userId))
      obj.accountStatus = u?.status || 'active'
      obj.mustChangePassword = Boolean(u?.mustChangePassword)
      obj.lastLogin = u?.lastLogin || null
      obj.username = u?.username || s.studentId
      obj.pendingBalance = Math.max(0, (s.totalFee || 0) - (s.paidFee || 0))
      return obj
    })

    sendResponse(res, 200, {
      students: enriched,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / lim),
    })
  } catch (err) {
    next(err)
  }
}

/**
 * CSV Export for Students Directory
 */
export const exportStudentsCsv = async (req, res, next) => {
  try {
    const { class: cls, batch, status } = req.query
    const filter = {}
    if (cls && cls !== 'All') filter.class = cls
    if (batch && batch !== 'All') filter.batch = batch
    if (status) filter.status = status

    const students = await Student.find(filter).sort({ class: 1, studentId: 1 })

    const headers = [
      'Roll Number', 'Full Name', 'Class', 'Batch', 'School',
      'Student Phone', 'Parent Name', 'Parent Phone', 'Monthly Fee',
      'Total Fee', 'Paid Fee', 'Pending Dues', 'Fee Status',
      'Admission Date', 'Status'
    ]

    const rows = students.map(s => {
      const pending = Math.max(0, (s.totalFee || 0) - (s.paidFee || 0))
      const admDate = s.admissionDate ? new Date(s.admissionDate).toLocaleDateString('en-IN') : ''
      return [
        `"${s.studentId || ''}"`,
        `"${(s.fullName || '').replace(/"/g, '""')}"`,
        `"${s.class || ''}"`,
        `"${s.batch || ''}"`,
        `"${(s.school || '').replace(/"/g, '""')}"`,
        `"${s.phone || ''}"`,
        `"${(s.parentName || '').replace(/"/g, '""')}"`,
        `"${s.parentPhone || ''}"`,
        s.monthlyFee || 0,
        s.totalFee || 0,
        s.paidFee || 0,
        pending,
        `"${s.feeStatus || 'pending'}"`,
        `"${admDate}"`,
        `"${s.status || 'active'}"`
      ].join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="vmc-students-${Date.now()}.csv"`)
    res.send(csv)
  } catch (err) {
    next(err)
  }
}

/**
 * Approve self-registered student account
 */
export const approveStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) return next(createError(404, 'Student not found'))

    const user = await User.findByIdAndUpdate(
      student.userId,
      { status: 'active' },
      { new: true }
    )
    if (!user) return next(createError(404, 'Linked user account not found'))

    student.status = 'active'
    if (!student.monthlyFee || student.monthlyFee === 0) {
      student.monthlyFee = getStandardMonthlyFee(student.class)
      student.totalFee = Math.max(0, student.monthlyFee * 10 - (student.discount || 0))
    }
    await student.save()

    // Mark any linked ContactInquiry records as enrolled
    await ContactInquiry.updateMany(
      { $or: [{ enrolledStudentId: student._id }, { phone: student.phone }] },
      { status: 'enrolled', enrolledStudentId: student._id, enrolledAt: new Date() }
    )

    // Build admission message
    const targetPhone = student.parentPhone || student.phone
    const credMessage = buildAdmissionCredentialsMessage({
      studentName: student.fullName,
      studentId: student.studentId,
      username: user.username,
      tempPassword: '(Your password set during registration)',
      studentClass: student.class,
      batch: student.batch,
    })
    const whatsAppLink = createDirectWhatsAppLink(targetPhone, credMessage)

    // Dispatch automated WhatsApp notification (non-blocking)
    let notificationResult = null
    if (targetPhone) {
      sendMetaWhatsAppMessage({
        to: targetPhone,
        text: credMessage,
      }).then(res => {
        notificationResult = res
      }).catch(err => {
        logger.error('WhatsApp dispatch error during student approval:', err.message)
      })
    }

    sendResponse(res, 200, {
      student,
      user,
      whatsAppLink,
      notificationResult,
    }, `Student ${student.fullName} (${student.studentId}) approved and activated successfully!`)

    recordAudit({
      action: 'student.approve',
      user: req.user,
      targetType: 'Student',
      targetId: student._id,
      description: `Approved student ${student.fullName} (${student.studentId})`,
      req,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Admin-assisted password reset for students (especially without verified email)
 */
export const adminResetStudentPassword = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) return next(createError(404, 'Student not found'))

    const user = await User.findById(student.userId)
    if (!user) return next(createError(404, 'Linked user account not found'))

    const newTempPassword = generateTempPassword(student.fullName)
    user.password = newTempPassword
    user.mustChangePassword = true
    await user.save()

    logger.info(`Admin reset password for student ${student.studentId}`)

    recordAudit({
      action: 'student.admin_reset_password',
      user: req.user,
      targetType: 'Student',
      targetId: student._id,
      description: `Admin reset password for student ${student.fullName} (${student.studentId})`,
      req,
    })

    sendResponse(res, 200, {
      studentId: student.studentId,
      username: user.username,
      temporaryPassword: newTempPassword,
      mustChangePassword: true,
    }, `Temporary password generated for ${student.fullName}. It will require a change upon login.`)
  } catch (err) {
    next(err)
  }
}

export const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) return next(createError(404, 'Student not found'))

    const user = await User.findById(student.userId).select('username status mustChangePassword lastLogin email')
    const payments = await Payment.find({ studentId: student._id }).sort({ paymentDate: -1 }).limit(10)
    const testResults = await TestResult.find({ studentId: student._id }).populate('testId').sort({ createdAt: -1 }).limit(10)

    sendResponse(res, 200, {
      ...student.toObject(),
      account: user,
      recentPayments: payments,
      recentTestResults: testResults,
      pendingBalance: Math.max(0, (student.totalFee || 0) - (student.paidFee || 0)),
    })
  } catch (err) {
    next(err)
  }
}

export const getMyProfile = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
    if (!student) return next(createError(404, 'Student profile not found'))

    const user = await User.findById(req.user._id).select('username status mustChangePassword lastLogin email')
    sendResponse(res, 200, {
      ...student.toObject(),
      account: user,
      pendingBalance: Math.max(0, (student.totalFee || 0) - (student.paidFee || 0)),
    })
  } catch (err) {
    next(err)
  }
}

export const getMyFees = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
    if (!student) return next(createError(404, 'Student not found'))

    const fees = await Fee.find({ studentId: student._id }).sort({ dueDate: -1 })
    const pendingBalance = Math.max(0, (student.totalFee || 0) - (student.paidFee || 0))

    sendResponse(res, 200, {
      studentDetails: {
        fullName: student.fullName,
        studentId: student.studentId,
        class: student.class,
        batch: student.batch,
        monthlyFee: student.monthlyFee,
        totalFee: student.totalFee,
        paidFee: student.paidFee,
        pendingBalance,
        feeStatus: student.feeStatus,
      },
      fees,
    })
  } catch (err) {
    next(err)
  }
}

export const getMyPayments = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
    if (!student) return next(createError(404, 'Student not found'))

    const payments = await Payment.find({ studentId: student._id }).sort({ paymentDate: -1 })
    sendResponse(res, 200, payments)
  } catch (err) {
    next(err)
  }
}

export const getMyAttendance = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
    if (!student) return next(createError(404, 'Student not found'))

    const attendance = await Attendance.find({ studentId: student._id }).sort({ date: -1 }).limit(60)
    const totalDays = attendance.length
    const presentDays = attendance.filter(a => ['present', 'late'].includes(a.status)).length
    const rate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100

    sendResponse(res, 200, { attendance, totalDays, presentDays, rate })
  } catch (err) {
    next(err)
  }
}

export const createStudent = async (req, res, next) => {
  try {
    const {
      name, fullName, email, phone, class: cls, section, batch,
      school, academicYear, parentName, parentPhone, monthlyFee,
      totalFee, discount, feePlan, address, dateOfBirth, course,
      admissionDate, notes,
    } = req.body

    const targetName = (name || fullName || '').trim()
    const targetClass = (cls || '').trim()
    const targetBatch = (batch || 'Evening').trim()

    if (!targetName || !targetClass) {
      return next(createError(400, 'Student name and class are required'))
    }

    if (email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() })
      if (existingUser) return next(createError(409, 'An account with this email already exists.'))
    }

    const normClass = normalizeStandard(targetClass)
    const { studentId, username, tempPassword } = await generateStudentCredentials(targetName, normClass)

    const accountEmail = email ? email.toLowerCase() : `${username}@vanitamaths.local`
    const user = await User.create({
      name: targetName,
      email: accountEmail,
      phone,
      username,
      password: tempPassword,
      role: 'student',
      status: 'active',
      mustChangePassword: true,
    })

    // Central authoritative monthly fee enforced server-side
    const authoritativeMonthlyFee = getStandardMonthlyFee(normClass)
    const disc = Number(discount || 0)
    const mFee = authoritativeMonthlyFee
    const tFee = mFee * 10

    const student = await Student.create({
      studentId,
      userId: user._id,
      fullName: targetName,
      email: accountEmail,
      phone,
      class: normClass,
      section: section || '',
      batch: targetBatch,
      school: school || '',
      academicYear: academicYear || String(new Date().getFullYear()),
      course: course || 'Mathematics',
      parentName,
      parentPhone,
      address,
      dateOfBirth,
      admissionDate: admissionDate || new Date(),
      monthlyFee: mFee,
      discount: disc,
      totalFee: Math.max(0, tFee - disc),
      paidFee: 0,
      feePlan: feePlan || 'monthly',
      feeStatus: 'pending',
      status: 'active',
      notes,
    })

    sendResponse(res, 201, {
      student,
      credentials: { studentId, username, password: tempPassword, mustChangePassword: true },
    }, `Student ${targetName} enrolled successfully with Roll Number ${studentId}`)

    recordAudit({
      action: 'student.create',
      user: req.user,
      targetType: 'Student',
      targetId: student._id,
      description: `Created student ${student.fullName} (${studentId})`,
      metadata: { class: targetClass, batch: targetBatch },
      req,
    })
  } catch (err) {
    next(err)
  }
}

export const updateStudent = async (req, res, next) => {
  try {
    const {
      fullName, email, phone, class: cls, section, batch, school,
      academicYear, parentName, parentPhone, monthlyFee, totalFee,
      discount, feePlan, status, feeStatus, address, dateOfBirth, course, notes,
    } = req.body

    const existingStudent = await Student.findById(req.params.id)
    if (!existingStudent) return next(createError(404, 'Student not found'))

    const updates = {
      fullName, email, phone, section, batch, school,
      academicYear, parentName, parentPhone,
      discount, feePlan, status, feeStatus, address, dateOfBirth, course, notes,
    }

    if (cls) {
      const normClass = normalizeStandard(cls)
      updates.class = normClass
      // Server-side authoritative fee enforcement for class
      updates.monthlyFee = getStandardMonthlyFee(normClass)
      const currentDisc = discount != null ? Number(discount) : (existingStudent.discount || 0)
      updates.totalFee = Math.max(0, updates.monthlyFee * 10 - currentDisc)
    } else if (monthlyFee) {
      // Retain standard fee for verified class
      updates.monthlyFee = getStandardMonthlyFee(existingStudent.class)
    }
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k])

    if (email && email.toLowerCase() !== existingStudent.email?.toLowerCase()) {
      const emailTaken = await User.findOne({ email: email.toLowerCase(), _id: { $ne: existingStudent.userId } })
      if (emailTaken) return next(createError(409, 'Email already in use by another account'))
    }

    if (req.file) updates.profilePhoto = req.file.path

    const student = await Student.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })

    // Sync account status with User
    const userSync = {}
    if (fullName) userSync.name = fullName
    if (email) userSync.email = email.toLowerCase()
    if (status) userSync.status = status
    if (Object.keys(userSync).length) await User.findByIdAndUpdate(student.userId, userSync)

    sendResponse(res, 200, student, 'Student details updated successfully')
  } catch (err) {
    next(err)
  }
}

export const toggleStudentStatus = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) return next(createError(404, 'Student not found'))

    const newStatus = student.status === 'active' ? 'inactive' : 'active'
    student.status = newStatus
    await student.save()

    await User.findByIdAndUpdate(student.userId, { status: newStatus })

    recordAudit({
      action: 'student.toggle_status',
      user: req.user,
      targetType: 'Student',
      targetId: student._id,
      description: `${newStatus === 'active' ? 'Reactivated' : 'Deactivated'} student ${student.fullName} (${student.studentId})`,
      req,
    })

    sendResponse(res, 200, { student, status: newStatus }, `Student ${newStatus === 'active' ? 'reactivated' : 'deactivated'} successfully.`)
  } catch (err) {
    next(err)
  }
}

/**
 * Preserve historical records — deactivates instead of permanent wipe
 */
export const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) return next(createError(404, 'Student not found'))

    student.status = 'inactive'
    await student.save()

    await User.findByIdAndUpdate(student.userId, { status: 'inactive' })

    recordAudit({
      action: 'student.deactivate',
      user: req.user,
      targetType: 'Student',
      targetId: student._id,
      description: `Safely deactivated student ${student.fullName} (${student.studentId}) to preserve historical records.`,
      req,
    })

    sendResponse(res, 200, null, 'Student deactivated. All historical marks and fee records are safely preserved.')
  } catch (err) {
    next(err)
  }
}

/**
 * Send automated fee reminder via Meta WhatsApp Cloud API (with manual fallback link)
 */
export const sendStudentFeeReminderWhatsApp = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) return next(createError(404, 'Student not found'))

    const pendingAmount = Math.max(0, (student.totalFee || 0) - (student.paidFee || 0))
    if (pendingAmount <= 0) {
      return next(createError(400, 'Student has no outstanding balance.'))
    }

    const targetPhone = student.parentPhone || student.phone
    if (!targetPhone) {
      return next(createError(400, 'No parent or student phone number registered.'))
    }

    const currentMonth = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })
    const reminderText = buildFeeReminderMessage({
      studentName: student.fullName,
      studentId: student.studentId,
      studentClass: student.class,
      month: currentMonth,
      pendingAmount,
    })

    const whatsAppLink = createDirectWhatsAppLink(targetPhone, reminderText)

    // Attempt automated Meta Cloud API send
    const result = await sendMetaWhatsAppMessage({
      to: targetPhone,
      text: reminderText,
    })

    recordAudit({
      action: 'fee.reminder_whatsapp',
      user: req.user,
      targetType: 'Student',
      targetId: student._id,
      description: `Dispatched fee reminder to ${student.fullName} (${targetPhone}) - Status: ${result.status}`,
      req,
    })

    sendResponse(res, 200, {
      ...result,
      whatsAppLink,
      pendingAmount,
      recipientPhone: targetPhone,
    }, result.success ? `WhatsApp fee reminder sent to ${targetPhone} via Cloud API!` : `Cloud API status: ${result.status}. Manual WhatsApp link ready.`)
  } catch (err) {
    next(err)
  }
}
