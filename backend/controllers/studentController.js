import Student from '../models/Student.js'
import User from '../models/User.js'
import Fee from '../models/Fee.js'
import Payment from '../models/Payment.js'
import Attendance from '../models/Attendance.js'
import { createError, sendResponse, paginate } from '../utils/helpers.js'
import { generateStudentCredentials } from '../utils/idGenerator.js'
import { recordAudit } from '../utils/auditLog.js'

export const getAllStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, batch, class: cls, status, feeStatus } = req.query
    const filter = {}
    if (status) filter.status = status
    if (batch) filter.batch = batch
    if (cls) filter.class = cls
    if (feeStatus) filter.feeStatus = feeStatus
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { parentName: { $regex: search, $options: 'i' } },
      ]
    }

    const { skip, limit: lim } = paginate(null, page, limit)
    const [students, total] = await Promise.all([
      Student.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim),
      Student.countDocuments(filter),
    ])

    // Attach the linked User account's status (active/inactive/pending) so the
    // admin UI can tell apart students who self-registered and are still
    // waiting for approval — this is separate from Student.status.
    const userIds = students.map(s => s.userId).filter(Boolean)
    const users = await User.find({ _id: { $in: userIds } }).select('_id status')
    const statusMap = new Map(users.map(u => [String(u._id), u.status]))
    const studentsWithAccountStatus = students.map(s => {
      const obj = s.toObject()
      obj.accountStatus = statusMap.get(String(s.userId)) || 'active'
      return obj
    })

    sendResponse(res, 200, {
      students: studentsWithAccountStatus, total,
      page: parseInt(page), pages: Math.ceil(total / lim),
    })
  } catch (err) {
    next(err)
  }
}

// Approve a self-registered student account (User.status: pending -> active).
// This is the missing piece that previously left publicly self-registered
// students permanently unable to log in, since nothing in the app ever
// flipped their User.status away from 'pending'.
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

    sendResponse(res, 200, { student, user }, 'Student account approved — they can now log in')

    recordAudit({
      action: 'student.approve', user: req.user, targetType: 'Student', targetId: student._id,
      description: `Approved self-registered student ${student.fullName}`, req,
    })
  } catch (err) {
    next(err)
  }
}

export const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) return next(createError(404, 'Student not found'))
    sendResponse(res, 200, student)
  } catch (err) {
    next(err)
  }
}

export const getMyProfile = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
    if (!student) return next(createError(404, 'Student profile not found'))
    sendResponse(res, 200, student)
  } catch (err) {
    next(err)
  }
}

export const createStudent = async (req, res, next) => {
  try {
    const {
      name, email, phone, class: cls, section, batch, academicYear,
      parentName, parentPhone, totalFee, feePlan, address, dateOfBirth, course, admissionDate,
    } = req.body

    if (!name || !cls || !batch) {
      return next(createError(400, 'Name, class, and batch are required'))
    }

    if (email) {
      const existingUser = await User.findOne({ email })
      if (existingUser) return next(createError(409, 'Email already exists'))
    }

    const { studentId, username, tempPassword } = await generateStudentCredentials(name, cls)

    const user = await User.create({
      name,
      email: email || `${username}@vanitamaths.local`,
      phone,
      username,
      password: tempPassword,
      role: 'student',
      status: 'active',
      mustChangePassword: true,
    })

    const student = await Student.create({
      studentId, userId: user._id,
      fullName: name, email: user.email, phone,
      class: cls, section, batch, academicYear,
      course, parentName, parentPhone, address, dateOfBirth,
      admissionDate: admissionDate || undefined,
      totalFee: totalFee || 0, feePlan: feePlan || 'monthly', feeStatus: 'pending',
    })

    sendResponse(res, 201, {
      student,
      credentials: { studentId, username, password: tempPassword },
    }, 'Student created successfully')

    recordAudit({
      action: 'student.create', user: req.user, targetType: 'Student', targetId: student._id,
      description: `Created student ${student.fullName} (${studentId})`,
      metadata: { class: cls, batch, section }, req,
    })
  } catch (err) {
    next(err)
  }
}

export const updateStudent = async (req, res, next) => {
  try {
    const { fullName, email, phone, class: cls, section, batch, academicYear, parentName, parentPhone, totalFee, feePlan, status, feeStatus, address, dateOfBirth, course, notes } = req.body
    const updates = { fullName, email, phone, class: cls, section, batch, academicYear, parentName, parentPhone, totalFee, feePlan, status, feeStatus, address, dateOfBirth, course, notes }
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k])

    const existingStudent = await Student.findById(req.params.id)
    if (!existingStudent) return next(createError(404, 'Student not found'))

    // If the email is actually changing, make sure no other account already
    // uses it before we touch either record.
    if (email && email.toLowerCase() !== existingStudent.email?.toLowerCase()) {
      const emailTaken = await User.findOne({ email: email.toLowerCase(), _id: { $ne: existingStudent.userId } })
      if (emailTaken) return next(createError(409, 'Email already in use by another account'))
    }

    if (req.file) updates.profilePhoto = `/uploads/profiles/${req.file.filename}`

    const student = await Student.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
    if (!student) return next(createError(404, 'Student not found'))

    // Sync name and email with the linked User account — Student.email and
    // User.email were previously independent, so editing a student's email
    // here never actually reached the account that forgot-password checks.
    const userSync = {}
    if (fullName) userSync.name = fullName
    if (email) userSync.email = email.toLowerCase()
    if (Object.keys(userSync).length) await User.findByIdAndUpdate(student.userId, userSync)

    // Sync account-level status with the linked User so admin edits here
    // actually take effect on login (Student.status and User.status are
    // separate fields and used to silently drift out of sync).
    if (status === 'active') await User.findByIdAndUpdate(student.userId, { status: 'active' })
    if (status === 'inactive') await User.findByIdAndUpdate(student.userId, { status: 'inactive' })

    sendResponse(res, 200, student, 'Student updated successfully')
  } catch (err) {
    next(err)
  }
}

export const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) return next(createError(404, 'Student not found'))

    await User.findByIdAndUpdate(student.userId, { status: 'inactive' })
    student.status = 'inactive'
    await student.save()

    sendResponse(res, 200, null, 'Student deactivated successfully')

    recordAudit({
      action: 'student.deactivate', user: req.user, targetType: 'Student', targetId: student._id,
      description: `Deactivated student ${student.fullName} (${student.studentId})`, req,
    })
  } catch (err) {
    next(err)
  }
}

export const getMyFees = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
    if (!student) return next(createError(404, 'Student profile not found'))

    const fees = await Fee.find({ studentId: student._id }).sort({ dueDate: -1 })
    sendResponse(res, 200, { student, fees })
  } catch (err) {
    next(err)
  }
}

export const getMyPayments = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
    if (!student) return next(createError(404, 'Student profile not found'))

    const payments = await Payment.find({ studentId: student._id }).populate('verifiedBy', 'name').sort({ paymentDate: -1 })
    sendResponse(res, 200, payments)
  } catch (err) {
    next(err)
  }
}

export const getMyAttendance = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
    if (!student) return next(createError(404, 'Student profile not found'))

    const { month, year } = req.query
    const filter = { studentId: student._id }

    if (month && year) {
      const start = new Date(year, month - 1, 1)
      const end = new Date(year, month, 0, 23, 59, 59)
      filter.date = { $gte: start, $lte: end }
    }

    const attendance = await Attendance.find(filter).sort({ date: -1 })
    const total = attendance.length
    const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0

    sendResponse(res, 200, { attendance, stats: { total, present, absent: total - present, percentage } })
  } catch (err) {
    next(err)
  }
}
