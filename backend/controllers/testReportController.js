import TestReport from '../models/TestReport.js'
import Student from '../models/Student.js'
import { createError, sendResponse, paginate } from '../utils/helpers.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const getTestReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, student } = req.query
    const filter = {}
    if (student) filter.student = student

    const { skip, limit: lim } = paginate(null, page, limit)
    const [reports, total] = await Promise.all([
      TestReport.find(filter)
        .populate('student', 'fullName studentId class')
        .populate('uploadedBy', 'name')
        .sort({ createdAt: -1 }).skip(skip).limit(lim),
      TestReport.countDocuments(filter),
    ])

    sendResponse(res, 200, { reports, total, page: parseInt(page), pages: Math.ceil(total / lim) })
  } catch (err) {
    next(err)
  }
}

export const getMyTestReports = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
    if (!student) return next(createError(404, 'Student profile not found'))

    const reports = await TestReport.find({
      $or: [
        { student: student._id },
        { student: null, class: student.class, batch: { $in: ['all', student.batch] } },
      ],
    })
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })

    sendResponse(res, 200, { reports })
  } catch (err) {
    next(err)
  }
}

export const uploadTestReport = async (req, res, next) => {
  try {
    if (!req.file) return next(createError(400, 'PDF file is required'))

    const { title, student, class: cls, batch, subject, testDate, marksObtained, totalMarks, remarks } = req.body

    if (!student && !cls) return next(createError(400, 'Select a student or a class'))
    if (student && cls) return next(createError(400, 'Choose either a student or a class, not both'))

    if (student) {
      const studentDoc = await Student.findById(student)
      if (!studentDoc) return next(createError(404, 'Student not found'))
    }

    const report = await TestReport.create({
      title,
      student: student || null,
      class: student ? null : cls,
      batch: student ? 'all' : (batch || 'all'),
      subject, testDate: testDate || undefined,
      marksObtained: marksObtained || undefined, totalMarks: totalMarks || undefined, remarks,
      filePath: `/uploads/test-reports/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user._id,
    })

    const populated = await TestReport.findById(report._id).populate('student', 'fullName studentId class')
    sendResponse(res, 201, populated, 'Test report uploaded successfully')
  } catch (err) {
    next(err)
  }
}

export const downloadTestReport = async (req, res, next) => {
  try {
    const report = await TestReport.findById(req.params.id).populate('student', 'userId class batch')
    if (!report) return next(createError(404, 'Report not found'))

    if (req.user.role === 'student') {
      const requester = await Student.findOne({ userId: req.user._id })
      if (!requester) return next(createError(403, 'You do not have permission to access this report'))

      const isOwnIndividualReport = report.student && String(report.student.userId) === String(req.user._id)
      const isOwnClassReport = !report.student && report.class === requester.class &&
        (report.batch === 'all' || report.batch === requester.batch)

      if (!isOwnIndividualReport && !isOwnClassReport) {
        return next(createError(403, 'You do not have permission to access this report'))
      }
    }

    const filePath = path.join(__dirname, '..', report.filePath)
    if (!fs.existsSync(filePath)) return next(createError(404, 'File not found on server'))

    res.download(filePath, report.fileName)
  } catch (err) {
    next(err)
  }
}

export const deleteTestReport = async (req, res, next) => {
  try {
    const report = await TestReport.findById(req.params.id)
    if (!report) return next(createError(404, 'Report not found'))

    const filePath = path.join(__dirname, '..', report.filePath)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

    await report.deleteOne()
    sendResponse(res, 200, null, 'Test report deleted')
  } catch (err) {
    next(err)
  }
}