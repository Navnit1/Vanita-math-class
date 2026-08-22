import Fee from '../models/Fee.js'
import Student from '../models/Student.js'
import { createError, sendResponse, paginate } from '../utils/helpers.js'

export const getAllFees = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, studentId, paymentStatus, month } = req.query
    const filter = {}
    if (studentId) filter.studentId = studentId
    if (paymentStatus) filter.paymentStatus = paymentStatus
    if (month) filter.month = { $regex: month, $options: 'i' }

    const { skip, limit: lim } = paginate(null, page, limit)
    const [fees, total] = await Promise.all([
      Fee.find(filter).populate('studentId', 'fullName studentId class batch').sort({ dueDate: -1 }).skip(skip).limit(lim),
      Fee.countDocuments(filter),
    ])

    sendResponse(res, 200, { fees, total, page: parseInt(page), pages: Math.ceil(total / lim) })
  } catch (err) {
    next(err)
  }
}

export const createFee = async (req, res, next) => {
  try {
    const { studentId, feeType, amount, dueDate, month, remarks } = req.body
    const student = await Student.findById(studentId)
    if (!student) return next(createError(404, 'Student not found'))

    const fee = await Fee.create({ studentId, feeType, amount, dueDate, month, remarks, createdBy: req.user._id })
    const populated = await Fee.findById(fee._id).populate('studentId', 'fullName studentId')
    sendResponse(res, 201, populated, 'Fee record created')
  } catch (err) {
    next(err)
  }
}

export const createBulkFees = async (req, res, next) => {
  try {
    const { batch, class: cls, feeType, amount, dueDate, month, remarks } = req.body

    const filter = { status: 'active' }
    if (batch) filter.batch = batch
    if (cls) filter.class = cls

    const students = await Student.find(filter)
    if (!students.length) return next(createError(404, 'No active students found for criteria'))

    const fees = students.map(s => ({
      studentId: s._id, feeType, amount, dueDate, month, remarks, createdBy: req.user._id,
    }))

    await Fee.insertMany(fees)
    sendResponse(res, 201, { count: fees.length }, `Fee records created for ${fees.length} students`)
  } catch (err) {
    next(err)
  }
}

export const updateFee = async (req, res, next) => {
  try {
    const { amount, dueDate, paymentStatus, paidAmount, remarks, receiptNumber } = req.body
    const updates = { amount, dueDate, paymentStatus, paidAmount, remarks, receiptNumber }
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k])

    const fee = await Fee.findByIdAndUpdate(req.params.id, updates, { new: true }).populate('studentId', 'fullName studentId')
    if (!fee) return next(createError(404, 'Fee not found'))

    sendResponse(res, 200, fee, 'Fee updated')
  } catch (err) {
    next(err)
  }
}

export const deleteFee = async (req, res, next) => {
  try {
    const fee = await Fee.findByIdAndDelete(req.params.id)
    if (!fee) return next(createError(404, 'Fee not found'))
    sendResponse(res, 200, null, 'Fee deleted')
  } catch (err) {
    next(err)
  }
}

export const getFeeStats = async (req, res, next) => {
  try {
    const [overview, overdue] = await Promise.all([
      Fee.aggregate([
        { $group: { _id: '$paymentStatus', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Fee.find({ paymentStatus: { $in: ['pending', 'overdue'] }, dueDate: { $lt: new Date() } })
        .populate('studentId', 'fullName studentId phone parentPhone'),
    ])

    sendResponse(res, 200, { overview, overdue })
  } catch (err) {
    next(err)
  }
}

export const getStudentFees = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.studentId)
    if (!student) return next(createError(404, 'Student not found'))

    const fees = await Fee.find({ studentId: req.params.studentId }).sort({ dueDate: -1 })
    sendResponse(res, 200, { student, fees })
  } catch (err) {
    next(err)
  }
}
