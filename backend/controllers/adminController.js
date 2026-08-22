import Student from '../models/Student.js'
import Teacher from '../models/Teacher.js'
import Payment from '../models/Payment.js'
import Fee from '../models/Fee.js'
import Attendance from '../models/Attendance.js'
import User from '../models/User.js'
import Material from '../models/Material.js'
import Announcement from '../models/Announcement.js'
import AuditLog from '../models/AuditLog.js'
import { sendResponse, generateTeacherId, createError } from '../utils/helpers.js'

export const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    const [
      totalStudents, totalTeachers, activeStudents,
      monthlyRevenue, lastMonthRevenue, totalRevenue,
      pendingFees, recentPayments, feeOverview, typeBreakdown,
      notesCount, notificationsCount, attendanceAgg,
    ] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments({ status: 'active' }),
      Student.countDocuments({ status: 'active' }),
      Payment.aggregate([{ $match: { paymentDate: { $gte: startOfMonth }, approvalStatus: 'approved' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { paymentDate: { $gte: lastMonth, $lte: endLastMonth }, approvalStatus: 'approved' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { approvalStatus: 'approved' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Fee.aggregate([{ $match: { paymentStatus: { $in: ['pending', 'overdue'] } } }, { $group: { _id: null, total: { $sum: { $subtract: ['$amount', { $ifNull: ['$paidAmount', 0] }] } } } }]),
      Payment.find({ approvalStatus: 'approved' }).populate('studentId', 'fullName studentId').sort({ paymentDate: -1 }).limit(5),
      Fee.aggregate([{ $group: { _id: '$paymentStatus', amount: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Payment.aggregate([
        { $match: { approvalStatus: 'approved' } },
        { $group: { _id: '$paymentType', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Material.countDocuments({ isActive: true }),
      Announcement.countDocuments({ isActive: true }),
      Attendance.aggregate([
        { $match: { date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } } } },
      ]),
    ])

    const attendancePercentage = attendanceAgg[0]?.total
      ? Math.round((attendanceAgg[0].present / attendanceAgg[0].total) * 100)
      : 0

    const monthRev = monthlyRevenue[0]?.total || 0
    const lastRev = lastMonthRevenue[0]?.total || 0
    const revenueGrowth = lastRev > 0 ? Math.round(((monthRev - lastRev) / lastRev) * 100) : 0

    // Monthly revenue chart (last 6 months)
    const monthlyChart = []
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      const [rev] = await Payment.aggregate([
        { $match: { paymentDate: { $gte: start, $lte: end }, approvalStatus: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' }, online: { $sum: { $cond: [{ $eq: ['$paymentType', 'online'] }, '$amount', 0] } }, offline: { $sum: { $cond: [{ $eq: ['$paymentType', 'offline'] }, '$amount', 0] } } } },
      ])
      monthlyChart.push({
        month: start.toLocaleString('default', { month: 'short' }),
        revenue: rev?.total || 0,
        online: rev?.online || 0,
        offline: rev?.offline || 0,
      })
    }

    const onlineTotal = typeBreakdown.find(t => t._id === 'online')?.total || 0
    const offlineTotal = typeBreakdown.find(t => t._id === 'offline')?.total || 0

    sendResponse(res, 200, {
      totalStudents,
      activeStudents,
      totalTeachers,
      monthlyRevenue: monthRev,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingFees: pendingFees[0]?.total || 0,
      revenueGrowth,
      recentPayments,
      feeOverview,
      monthlyChart,
      onlineRevenue: onlineTotal,
      offlineRevenue: offlineTotal,
      notesCount,
      notificationsCount,
      attendancePercentage,
    })
  } catch (err) {
    next(err)
  }
}

export const getTeachers = async (req, res, next) => {
  try {
    const { search, status } = req.query
    const filter = {}
    if (status) filter.status = status
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { teacherId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }
    const teachers = await Teacher.find(filter).sort({ createdAt: -1 })
    sendResponse(res, 200, teachers)
  } catch (err) {
    next(err)
  }
}

export const createTeacher = async (req, res, next) => {
  try {
    const { name, email, phone, password, subjects, batches, qualification, salary, address } = req.body
    const existingUser = await User.findOne({ email })
    if (existingUser) return next(createError(409, 'Email already exists'))
    const user = await User.create({ name, email, phone, password: password || 'VMC@1234', role: 'teacher', status: 'active' })
    const teacherId = generateTeacherId()
    const teacher = await Teacher.create({ teacherId, userId: user._id, name, email, phone, subjects, batches, qualification, salary, address })
    sendResponse(res, 201, teacher, 'Teacher created successfully')
  } catch (err) {
    next(err)
  }
}

export const updateTeacher = async (req, res, next) => {
  try {
    const { name, phone, subjects, batches, qualification, salary, status, address, notes } = req.body
    const updates = { name, phone, subjects, batches, qualification, salary, status, address, notes }
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k])
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, updates, { new: true })
    if (!teacher) return next(createError(404, 'Teacher not found'))
    if (name) await User.findByIdAndUpdate(teacher.userId, { name })
    sendResponse(res, 200, teacher, 'Teacher updated')
  } catch (err) {
    next(err)
  }
}

export const deleteTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
    if (!teacher) return next(createError(404, 'Teacher not found'))
    await User.findByIdAndUpdate(teacher.userId, { status: 'inactive' })
    teacher.status = 'inactive'
    await teacher.save()
    sendResponse(res, 200, null, 'Teacher deactivated')
  } catch (err) {
    next(err)
  }
}

export const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, action, performedBy } = req.query
    const filter = {}
    if (action) filter.action = { $regex: action, $options: 'i' }
    if (performedBy) filter.performedBy = performedBy

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      AuditLog.countDocuments(filter),
    ])

    sendResponse(res, 200, { logs, total, page: parseInt(page), pages: Math.ceil(total / limit) })
  } catch (err) {
    next(err)
  }
}

export const getReports = async (req, res, next) => {
  try {
    const { type, month, year, batch, class: cls } = req.query

    if (type === 'fees') {
      const filter = {}
      if (month && year) filter.month = `${month} ${year}`
      if (batch) {
        const students = await Student.find({ batch }).select('_id')
        filter.studentId = { $in: students.map(s => s._id) }
      }
      const fees = await Fee.find(filter).populate('studentId', 'fullName studentId class batch phone parentPhone')
      return sendResponse(res, 200, fees)
    }

    if (type === 'attendance') {
      const summary = await Attendance.aggregate([
        { $group: {
          _id: '$studentId',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
        }},
        { $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'student' } },
        { $unwind: '$student' },
        { $project: {
          fullName: '$student.fullName', studentId: '$student.studentId', class: '$student.class', batch: '$student.batch',
          total: 1, present: 1, absent: { $subtract: ['$total', '$present'] },
          percentage: { $round: [{ $multiply: [{ $divide: ['$present', { $cond: [{ $eq: ['$total', 0] }, 1, '$total'] }] }, 100] }, 0] },
        }},
      ])
      return sendResponse(res, 200, summary)
    }

    if (type === 'revenue') {
      const startOfYear = new Date(year || new Date().getFullYear(), 0, 1)
      const monthly = await Payment.aggregate([
        { $match: { paymentDate: { $gte: startOfYear }, approvalStatus: 'approved' } },
        { $group: { _id: { month: { $month: '$paymentDate' }, year: { $year: '$paymentDate' } }, total: { $sum: '$amount' }, count: { $sum: 1 }, online: { $sum: { $cond: [{ $eq: ['$paymentType', 'online'] }, '$amount', 0] } }, offline: { $sum: { $cond: [{ $eq: ['$paymentType', 'offline'] }, '$amount', 0] } } } },
        { $sort: { '_id.month': 1 } },
      ])
      return sendResponse(res, 200, monthly)
    }

    const filter = {}
    if (batch) filter.batch = batch
    if (cls) filter.class = cls
    const students = await Student.find(filter).sort({ fullName: 1 })
    sendResponse(res, 200, students)
  } catch (err) {
    next(err)
  }
}
