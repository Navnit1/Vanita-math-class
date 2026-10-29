import Payment from '../models/Payment.js'
import Student from '../models/Student.js'
import Fee from '../models/Fee.js'
import { createError, generateReceiptNumber, sendResponse, paginate } from '../utils/helpers.js'
import { createRazorpayOrder, verifyRazorpaySignature, getVerifiedPaymentAmount } from '../services/razorpayService.js'
import { generateReceiptPDF } from '../services/receiptService.js'
import logger from '../utils/logger.js'
import {
  sendMetaWhatsAppMessage,
  createDirectWhatsAppLink,
  buildFeeReceiptMessage
} from '../services/whatsappService.js'

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

// ─── ADMIN: record offline payment (with Idempotency & WhatsApp Receipt) ──────
export const createPayment = async (req, res, next) => {
  try {
    const {
      studentId, feeId, amount, paymentMethod, paymentDate,
      notes, month, transactionId, notifyWhatsApp, idempotencyKey
    } = req.body

    const student = await Student.findById(studentId)
    if (!student) return next(createError(404, 'Student not found'))

    const pendingFee = Math.max(0, (student.totalFee || 0) - (student.paidFee || 0))
    if (Number(amount) > pendingFee && pendingFee > 0) {
      return next(createError(400, `Amount cannot exceed pending fee of ₹${pendingFee}`))
    }

    // Idempotency check: if an identical payment was created in the last 60 seconds
    const recentCheck = new Date(Date.now() - 60 * 1000)
    const duplicate = await Payment.findOne({
      studentId,
      amount: Number(amount),
      paymentMethod,
      createdAt: { $gte: recentCheck },
      ...(transactionId ? { transactionId } : {}),
    })

    if (duplicate) {
      logger.info(`Duplicate payment prevented by idempotency check. Returning existing receipt ${duplicate.receiptNumber}`)
      const popDup = await Payment.findById(duplicate._id).populate('studentId', 'fullName studentId class batch phone parentPhone totalFee paidFee')
      return sendResponse(res, 200, popDup, `Payment was already recorded with receipt ${duplicate.receiptNumber}.`)
    }

    const receiptNumber = generateReceiptNumber()

    const payment = await Payment.create({
      studentId,
      feeId: feeId || null,
      amount: Number(amount),
      paymentMethod,
      paymentDate: paymentDate || new Date(),
      receiptNumber,
      receiptImage: req.file ? req.file.path : null,
      notes,
      month: month || new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
      transactionId: transactionId || null,
      paymentType: 'offline',
      approvalStatus: 'approved',
      status: 'recorded',
      createdBy: req.user._id,
    })

    const updatedStudent = await applyPaymentToStudent(studentId, amount)
    await applyPaymentToFee(feeId, amount, receiptNumber)

    logger.info(`Payment recorded: ${receiptNumber} for student ${student.studentId} (₹${amount})`)

    // Prepare WhatsApp Receipt details
    const remainingBalance = Math.max(0, (updatedStudent.totalFee || 0) - (updatedStudent.paidFee || 0))
    const formattedDate = new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    const receiptMsg = buildFeeReceiptMessage({
      receiptNumber,
      studentName: student.fullName,
      studentId: student.studentId,
      studentClass: student.class,
      amountPaid: amount,
      paymentMethod: paymentMethod.toUpperCase(),
      date: formattedDate,
      remainingBalance,
    })

    const targetPhone = student.parentPhone || student.phone
    const whatsappLink = createDirectWhatsAppLink(targetPhone, receiptMsg)

    // If requested, attempt automated Meta WhatsApp send without blocking or failing on error
    if (notifyWhatsApp && targetPhone) {
      sendMetaWhatsAppMessage({
        to: targetPhone,
        text: receiptMsg,
      }).catch(err => {
        logger.error('WhatsApp receipt notification error (payment recorded safely):', err.message)
      })
    }

    const populated = await Payment.findById(payment._id)
      .populate('studentId', 'fullName studentId class batch phone parentPhone totalFee paidFee')
      .populate('createdBy', 'name')

    sendResponse(res, 201, {
      ...populated.toObject(),
      whatsappLink,
      remainingBalance,
    }, `Payment of ₹${amount} recorded successfully. Receipt: ${receiptNumber}`)
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

    const verifiedAmount = await getVerifiedPaymentAmount(paymentId)

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
      month: month || new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
      paymentType: 'online',
      gatewayOrderId: orderId,
      gatewayPaymentId: paymentId,
      transactionId: paymentId,
      approvalStatus: 'approved',
      status: 'verified',
      verifiedAt: new Date(),
      createdBy: req.user._id,
    })

    await applyPaymentToStudent(student._id, verifiedAmount)
    await applyPaymentToFee(feeId, verifiedAmount, receiptNumber)

    logger.info(`Online payment verified: ${receiptNumber} (₹${verifiedAmount})`)

    const populated = await Payment.findById(payment._id).populate('studentId', 'fullName studentId')
    sendResponse(res, 200, populated, `Payment of ₹${verifiedAmount} verified successfully. Receipt: ${receiptNumber}`)
  } catch (err) {
    next(err)
  }
}

// ─── List Payments (Searchable & Filterable) ──────────────────────────────────
export const getAllPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, studentId, paymentType, paymentMethod, startDate, endDate, search } = req.query
    const filter = {}

    if (studentId) filter.studentId = studentId
    if (paymentType) filter.paymentType = paymentType
    if (paymentMethod) filter.paymentMethod = paymentMethod
    if (startDate || endDate) {
      filter.paymentDate = {}
      if (startDate) filter.paymentDate.$gte = new Date(startDate)
      if (endDate) filter.paymentDate.$lte = new Date(endDate)
    }
    if (search) {
      filter.$or = [
        { receiptNumber: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } },
        { month: { $regex: search, $options: 'i' } },
      ]
    }

    const { skip, limit: lim } = paginate(null, page, limit)
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('studentId', 'fullName studentId class batch parentName parentPhone phone')
        .populate('createdBy', 'name')
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(lim),
      Payment.countDocuments(filter),
    ])

    // Attach WhatsApp receipt link to each payment
    const enriched = payments.map(p => {
      const obj = p.toObject()
      const s = p.studentId || {}
      const targetPhone = s.parentPhone || s.phone
      if (targetPhone) {
        const remainingBalance = Math.max(0, (s.totalFee || 0) - (s.paidFee || 0))
        const receiptText = buildFeeReceiptMessage({
          receiptNumber: p.receiptNumber,
          studentName: s.fullName,
          studentId: s.studentId,
          studentClass: s.class,
          amountPaid: p.amount,
          paymentMethod: p.paymentMethod?.toUpperCase(),
          date: new Date(p.paymentDate).toLocaleDateString('en-IN'),
          remainingBalance,
        })
        obj.whatsappLink = createDirectWhatsAppLink(targetPhone, receiptText)
      }
      return obj
    })

    sendResponse(res, 200, { payments: enriched, total, page: parseInt(page), pages: Math.ceil(total / lim) })
  } catch (err) {
    next(err)
  }
}

// ─── Get Payment / Receipt by ID ──────────────────────────────────────────────
export const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('studentId', 'fullName studentId class batch parentName parentPhone phone totalFee paidFee feeStatus address')
      .populate('createdBy', 'name')

    if (!payment) return next(createError(404, 'Payment record not found'))

    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id })
      if (!student || String(payment.studentId._id) !== String(student._id)) {
        return next(createError(403, 'You do not have permission to view this receipt.'))
      }
    }

    const s = payment.studentId || {}
    const remainingBalance = Math.max(0, (s.totalFee || 0) - (s.paidFee || 0))
    const targetPhone = s.parentPhone || s.phone

    const receiptMsg = buildFeeReceiptMessage({
      receiptNumber: payment.receiptNumber,
      studentName: s.fullName,
      studentId: s.studentId,
      studentClass: s.class,
      amountPaid: payment.amount,
      paymentMethod: payment.paymentMethod?.toUpperCase(),
      date: new Date(payment.paymentDate).toLocaleDateString('en-IN'),
      remainingBalance,
    })

    sendResponse(res, 200, {
      ...payment.toObject(),
      remainingBalance,
      whatsappLink: targetPhone ? createDirectWhatsAppLink(targetPhone, receiptMsg) : null,
    })
  } catch (err) {
    next(err)
  }
}

// ─── Download receipt PDF ─────────────────────────────────────────────────────
export const downloadReceipt = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('studentId', 'fullName studentId class batch parentName parentPhone phone totalFee paidFee feeStatus school address')

    if (!payment) return next(createError(404, 'Payment not found'))

    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id })
      if (!student || String(payment.studentId._id) !== String(student._id)) {
        return next(createError(403, 'Not authorized to download this receipt'))
      }
    }

    generateReceiptPDF(payment, payment.studentId, res)
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

// ─── Delete payment (Admin) ───────────────────────────────────────────────────
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

export const getPaymentStats = async (req, res, next) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const [monthlyRevenue, allTimeRevenue, recentPayments] = await Promise.all([
      Payment.aggregate([
        { $match: { paymentDate: { $gte: startOfMonth }, approvalStatus: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { approvalStatus: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.find({ approvalStatus: 'approved' })
        .populate('studentId', 'fullName studentId class batch')
        .sort({ paymentDate: -1 }).limit(10),
    ])

    sendResponse(res, 200, {
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      allTimeRevenue: allTimeRevenue[0]?.total || 0,
      recentPayments,
    })
  } catch (err) {
    next(err)
  }
}
