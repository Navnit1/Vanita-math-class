import Payment from '../models/Payment.js'
import Student from '../models/Student.js'
import Fee from '../models/Fee.js'
import { createError, generateReceiptNumber, sendResponse, paginate } from '../utils/helpers.js'
import { createRazorpayOrder, verifyRazorpaySignature, getVerifiedPaymentAmount } from '../services/razorpayService.js'
import { generateReceiptPDF } from '../services/receiptService.js'
import logger from '../utils/logger.js'

// ─── Shared: update student + fee after payment ──────────────────────────────
const applyPaymentToStudent = async (studentId, amount) => {
  const student = await Student.findById(studentId)
  if (!student) throw new Error('Student not found')
  student.paidFee = (student.paidFee || 0) + Number(amount)
  if (student.paidFee >= student.totalFee) student.feeStatus = 'paid'
  else if (student.paidFee > 0) student.feeStatus = 'partial'
  else student.feeStatus = 'pending'
  await student.save()
  return student
}

const applyPaymentToFee = async (feeId, amount, receiptNumber) => {
  if (!feeId) return null
  const fee = await Fee.findById(feeId)
  if (!fee) return null
  fee.paidAmount = (fee.paidAmount || 0) + Number(amount)
  fee.paymentStatus = fee.paidAmount >= fee.amount ? 'paid' : 'partial'
  if (!fee.receiptNumber) fee.receiptNumber = receiptNumber
  await fee.save()
  return fee
}

// ─── ADMIN: record offline payment ───────────────────────────────────────────
export const createPayment = async (req, res, next) => {
  try {
    const { studentId, feeId, amount, paymentMethod, paymentDate, notes, month } = req.body

    const student = await Student.findById(studentId)
    if (!student) return next(createError(404, 'Student not found'))

    const pendingFee = Math.max(0, (student.totalFee || 0) - (student.paidFee || 0))
    if (Number(amount) > pendingFee && pendingFee > 0) {
      return next(createError(400, `Amount cannot exceed pending fee of ₹${pendingFee}`))
    }

    const receiptNumber = generateReceiptNumber()

    const payment = await Payment.create({
      studentId,
      feeId: feeId || null,
      amount: Number(amount),
      paymentMethod,
      paymentDate: paymentDate || new Date(),
      receiptNumber,
      receiptImage: req.file ? `/uploads/receipts/${req.file.filename}` : null,
      notes,
      month,
      paymentType: 'offline',
      approvalStatus: 'approved',
      status: 'recorded',
      createdBy: req.user._id,
    })

    await applyPaymentToStudent(studentId, amount)
    await applyPaymentToFee(feeId, amount, receiptNumber)

    logger.info(`Offline payment recorded: ${receiptNumber} for student ${student.studentId}`)

    const populated = await Payment.findById(payment._id)
      .populate('studentId', 'fullName studentId')
      .populate('createdBy', 'name')
    sendResponse(res, 201, populated, `Payment of ₹${amount} recorded. Receipt: ${receiptNumber}`)
  } catch (err) {
    next(err)
  }
}

// ─── STUDENT: create Razorpay order ──────────────────────────────────────────
export const createOnlineOrder = async (req, res, next) => {
  try {
    const { amount, feeId } = req.body

    const student = await Student.findOne({ userId: req.user._id })
    if (!student) return next(createError(404, 'Student profile not found'))

    const pendingFee = Math.max(0, (student.totalFee || 0) - (student.paidFee || 0))
    if (!amount || Number(amount) < 1) return next(createError(400, 'Invalid amount'))
    if (Number(amount) > pendingFee) return next(createError(400, `Amount cannot exceed pending fee of ₹${pendingFee}`))

    const receipt = `VMC-${Date.now()}`
    const order = await createRazorpayOrder({
      amount: Number(amount),
      receipt,
      notes: {
        studentId: student.studentId,
        studentName: student.fullName,
        feeId: feeId || '',
      },
    })

    sendResponse(res, 200, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      studentName: student.fullName,
      studentEmail: student.email,
      studentPhone: student.phone,
      pendingFee,
    }, 'Order created')
  } catch (err) {
    next(err)
  }
}

// ─── STUDENT: verify Razorpay payment and save ───────────────────────────────
export const verifyOnlinePayment = async (req, res, next) => {
  try {
    const { orderId, paymentId, signature, feeId, month } = req.body

    const isValid = verifyRazorpaySignature({ orderId, paymentId, signature })
    if (!isValid) return next(createError(400, 'Payment signature verification failed'))

    // SECURITY: never trust an amount sent by the browser. Ask Razorpay
    // what it actually captured for this paymentId and use that instead —
    // otherwise a tampered request could credit a student for more than
    // they actually paid.
    const verifiedAmount = await getVerifiedPaymentAmount(paymentId)

    // Idempotency: if this gatewayPaymentId was already recorded (e.g. the
    // client retried after a network blip), don't double-credit the student.
    const existing = await Payment.findOne({ gatewayPaymentId: paymentId })
    if (existing) {
      const populatedExisting = await Payment.findById(existing._id).populate('studentId', 'fullName studentId')
      return sendResponse(res, 200, populatedExisting, 'Payment already recorded')
    }

    const student = await Student.findOne({ userId: req.user._id })
    if (!student) return next(createError(404, 'Student not found'))

    const receiptNumber = generateReceiptNumber()

    const payment = await Payment.create({
      studentId: student._id,
      feeId: feeId || null,
      amount: verifiedAmount,
      paymentMethod: 'online',
      paymentDate: new Date(),
      receiptNumber,
      paymentType: 'online',
      transactionId: paymentId,
      gatewayOrderId: orderId,
      gatewayPaymentId: paymentId,
      approvalStatus: 'approved',
      status: 'verified',
      month: month || null,
      createdBy: req.user._id,
    })

    await applyPaymentToStudent(student._id, verifiedAmount)
    await applyPaymentToFee(feeId, verifiedAmount, receiptNumber)

    logger.info(`Online payment verified: ${receiptNumber} for ${student.studentId}, paymentId: ${paymentId}, amount: ${verifiedAmount}`)

    const populated = await Payment.findById(payment._id).populate('studentId', 'fullName studentId')
    sendResponse(res, 200, populated, `Payment of ₹${verifiedAmount} received. Receipt: ${receiptNumber}`)
  } catch (err) {
    next(err)
  }
}

// ─── ADMIN: get all payments ──────────────────────────────────────────────────
export const getAllPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, month, paymentMethod, status, paymentType, batch } = req.query
    const filter = {}
    if (month) filter.month = { $regex: month, $options: 'i' }
    if (paymentMethod) filter.paymentMethod = paymentMethod
    if (status) filter.status = status
    if (paymentType) filter.paymentType = paymentType

    if (search || batch) {
      const studentFilter = {}
      if (search) {
        studentFilter.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { studentId: { $regex: search, $options: 'i' } },
        ]
      }
      if (batch) studentFilter.batch = batch
      const students = await Student.find(studentFilter).select('_id')
      filter.studentId = { $in: students.map(s => s._id) }
    }

    const { skip, limit: lim } = paginate(null, page, limit)
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('studentId', 'fullName studentId class batch')
        .populate('createdBy', 'name')
        .populate('verifiedBy', 'name')
        .sort({ paymentDate: -1 })
        .skip(skip).limit(lim),
      Payment.countDocuments(filter),
    ])

    sendResponse(res, 200, { payments, total, page: parseInt(page), pages: Math.ceil(total / lim) })
  } catch (err) {
    next(err)
  }
}

export const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('studentId', 'fullName studentId class batch email phone parentName totalFee paidFee feeStatus')
      .populate('createdBy', 'name')
      .populate('verifiedBy', 'name')
    if (!payment) return next(createError(404, 'Payment not found'))
    sendResponse(res, 200, payment)
  } catch (err) {
    next(err)
  }
}

// ─── ADMIN: verify a payment ──────────────────────────────────────────────────
export const verifyPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
    if (!payment) return next(createError(404, 'Payment not found'))
    payment.status = 'verified'
    payment.verifiedBy = req.user._id
    payment.verifiedAt = new Date()
    await payment.save()
    sendResponse(res, 200, payment, 'Payment verified')
  } catch (err) {
    next(err)
  }
}

// ─── ADMIN: update payment ────────────────────────────────────────────────────
export const updatePayment = async (req, res, next) => {
  try {
    const { amount, paymentMethod, paymentDate, notes, month } = req.body
    const updates = { amount, paymentMethod, paymentDate, notes, month }
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k])
    if (req.file) updates.receiptImage = `/uploads/receipts/${req.file.filename}`

    const payment = await Payment.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('studentId', 'fullName studentId')
    if (!payment) return next(createError(404, 'Payment not found'))
    sendResponse(res, 200, payment, 'Payment updated')
  } catch (err) {
    next(err)
  }
}

// ─── ADMIN: delete payment ────────────────────────────────────────────────────
export const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
    if (!payment) return next(createError(404, 'Payment not found'))

    const student = await Student.findById(payment.studentId)
    if (student) {
      student.paidFee = Math.max(0, (student.paidFee || 0) - payment.amount)
      if (student.paidFee === 0) student.feeStatus = 'pending'
      else if (student.paidFee < student.totalFee) student.feeStatus = 'partial'
      await student.save()
    }

    if (payment.feeId) {
      const fee = await Fee.findById(payment.feeId)
      if (fee) {
        fee.paidAmount = Math.max(0, (fee.paidAmount || 0) - payment.amount)
        fee.paymentStatus = fee.paidAmount >= fee.amount ? 'paid' : fee.paidAmount > 0 ? 'partial' : 'pending'
        await fee.save()
      }
    }

    await payment.deleteOne()
    logger.info(`Payment deleted: ${payment.receiptNumber}`)
    sendResponse(res, 200, null, 'Payment deleted')
  } catch (err) {
    next(err)
  }
}

// ─── STUDENT: view own payment history ───────────────────────────────────────
export const getMyPayments = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
    if (!student) return next(createError(404, 'Student not found'))

    const payments = await Payment.find({ studentId: student._id })
      .sort({ paymentDate: -1 })

    sendResponse(res, 200, payments)
  } catch (err) {
    next(err)
  }
}

// ─── Download receipt PDF ─────────────────────────────────────────────────────
export const downloadReceipt = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('studentId', 'fullName studentId class batch parentName totalFee paidFee feeStatus')

    if (!payment) return next(createError(404, 'Payment not found'))

    // Authorization: student can only download their own receipts
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id })
      if (!student || payment.studentId._id.toString() !== student._id.toString()) {
        return next(createError(403, 'Not authorized'))
      }
    }

    generateReceiptPDF(payment, payment.studentId, res)
  } catch (err) {
    next(err)
  }
}

// ─── Payment stats (admin dashboard) ─────────────────────────────────────────
export const getPaymentStats = async (req, res, next) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    const [monthlyRevenue, yearlyRevenue, recentPayments, methodBreakdown, typeBreakdown] = await Promise.all([
      Payment.aggregate([
        { $match: { paymentDate: { $gte: startOfMonth }, approvalStatus: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { paymentDate: { $gte: startOfYear }, approvalStatus: 'approved' } },
        { $group: { _id: { month: { $month: '$paymentDate' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { '_id.month': 1 } },
      ]),
      Payment.find({ approvalStatus: 'approved' })
        .populate('studentId', 'fullName studentId')
        .sort({ paymentDate: -1 }).limit(10),
      Payment.aggregate([
        { $match: { approvalStatus: 'approved' } },
        { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { approvalStatus: 'approved' } },
        { $group: { _id: '$paymentType', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ])

    sendResponse(res, 200, {
      monthlyRevenue: monthlyRevenue[0] || { total: 0, count: 0 },
      yearlyByMonth: yearlyRevenue,
      recentPayments,
      methodBreakdown,
      typeBreakdown,
    })
  } catch (err) {
    next(err)
  }
}
