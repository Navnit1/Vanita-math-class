import Attendance from '../models/Attendance.js'
import Student from '../models/Student.js'
import { createError, sendResponse } from '../utils/helpers.js'
import { recordAudit } from '../utils/auditLog.js'

export const markAttendance = async (req, res, next) => {
  try {
    const { class: cls, batch, date, records } = req.body
    // records: [{ studentId, status, notes }]

    const attendanceDate = new Date(date)
    attendanceDate.setHours(0, 0, 0, 0)

    const ops = records.map(r => ({
      updateOne: {
        filter: { studentId: r.studentId, class: cls, batch, date: attendanceDate },
        update: { $set: { status: r.status, notes: r.notes, markedBy: req.user._id } },
        upsert: true,
      },
    }))

    await Attendance.bulkWrite(ops)
    sendResponse(res, 200, null, `Attendance marked for ${records.length} students`)

    recordAudit({
      action: 'attendance.mark', user: req.user, targetType: 'Attendance',
      description: `Marked attendance for ${cls} - ${batch} on ${date} (${records.length} students)`,
      metadata: { class: cls, batch, date }, req,
    })
  } catch (err) {
    next(err)
  }
}

export const getAttendanceByBatchDate = async (req, res, next) => {
  try {
    const { class: cls, batch, date } = req.query
    if (!cls || !batch || !date) return next(createError(400, 'Standard, batch, and date are required'))

    const attendanceDate = new Date(date)
    attendanceDate.setHours(0, 0, 0, 0)

    const students = await Student.find({ class: cls, batch, status: 'active' }).select('fullName studentId')
    const existingRecords = await Attendance.find({ class: cls, batch, date: attendanceDate })

    const recordMap = {}
    existingRecords.forEach(r => { recordMap[r.studentId.toString()] = r.status })

    const attendance = students.map(s => ({
      studentId: s._id,
      studentObjectId: s._id,
      fullName: s.fullName,
      studentIdCode: s.studentId,
      status: recordMap[s._id.toString()] || 'absent',
    }))

    sendResponse(res, 200, { attendance, date: attendanceDate, class: cls, batch })
  } catch (err) {
    next(err)
  }
}

export const getStudentAttendance = async (req, res, next) => {
  try {
    const { studentId } = req.params
    const { month, year } = req.query
    const filter = { studentId }

    if (month && year) {
      const start = new Date(year, month - 1, 1)
      const end = new Date(year, month, 0, 23, 59, 59)
      filter.date = { $gte: start, $lte: end }
    }

    const attendance = await Attendance.find(filter).sort({ date: -1 })
    const total = attendance.length
    const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length

    sendResponse(res, 200, {
      attendance,
      stats: { total, present, absent: total - present, percentage: total > 0 ? Math.round((present / total) * 100) : 0 },
    })
  } catch (err) {
    next(err)
  }
}

export const getBatchAttendanceSummary = async (req, res, next) => {
  try {
    const { class: cls, batch, month, year } = req.query
    const filter = {}
    if (cls) filter.class = cls
    if (batch) filter.batch = batch
    if (month && year) {
      filter.date = { $gte: new Date(year, month - 1, 1), $lte: new Date(year, month, 0, 23, 59, 59) }
    }

    const summary = await Attendance.aggregate([
      { $match: filter },
      { $group: {
        _id: '$studentId',
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
      }},
      { $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'student' } },
      { $unwind: '$student' },
      { $project: {
        fullName: '$student.fullName', studentId: '$student.studentId', batch: '$student.batch',
        total: 1, present: 1, absent: { $subtract: ['$total', '$present'] },
        percentage: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 0] },
      }},
    ])

    sendResponse(res, 200, summary)
  } catch (err) {
    next(err)
  }
}

export const editAttendanceRecord = async (req, res, next) => {
  try {
    const { status, notes } = req.body
    const record = await Attendance.findByIdAndUpdate(req.params.id, { status, notes, markedBy: req.user._id }, { new: true })
    if (!record) return next(createError(404, 'Attendance record not found'))
    sendResponse(res, 200, record, 'Attendance updated')
  } catch (err) {
    next(err)
  }
}
