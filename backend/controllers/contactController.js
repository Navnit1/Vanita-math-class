import ContactInquiry from '../models/ContactInquiry.js'
import Student from '../models/Student.js'
import User from '../models/User.js'
import { sendResponse, createError, paginate } from '../utils/helpers.js'
import { generateStudentCredentials } from '../utils/idGenerator.js'
import { recordAudit } from '../utils/auditLog.js'
import logger from '../utils/logger.js'
import {
  sendMetaWhatsAppMessage,
  createDirectWhatsAppLink,
  buildAdmissionCredentialsMessage,
  notifyAdminWhatsApp,
  buildAdminNewEnquiryAlert
} from '../services/whatsappService.js'
import { sendEmail, isEmailConfigured } from '../services/emailService.js'

export const submitInquiry = async (req, res, next) => {
  try {
    const {
      name, studentName, parentName, email, phone,
      class: cls, interestedStandard, school, preferredBatch, message
    } = req.body

    const targetName = (name || studentName || '').trim()
    const targetPhone = (phone || '').trim()
    const targetClass = (cls || interestedStandard || '').trim()

    if (!targetName || !targetPhone || !targetClass) {
      return next(createError(400, 'Student name, phone number, and class are required.'))
    }

    // Check for rapid spam / duplicate submissions (within last 3 minutes with same phone & class)
    const recentDuplicate = await ContactInquiry.findOne({
      phone: targetPhone,
      class: targetClass,
      createdAt: { $gte: new Date(Date.now() - 3 * 60 * 1000) }
    })
    if (recentDuplicate) {
      return sendResponse(res, 200, {
        id: recentDuplicate._id,
        inquiry: recentDuplicate,
      }, 'Thank you! Your enquiry has already been received. Mrs. Vanita Rani Gupta will contact you shortly.')
    }

    const inquiry = await ContactInquiry.create({
      name: targetName,
      parentName: (parentName || '').trim(),
      email: (email || '').trim().toLowerCase(),
      phone: targetPhone,
      class: targetClass,
      school: (school || '').trim(),
      preferredBatch: (preferredBatch || 'Evening').trim(),
      message: (message || '').trim(),
      status: 'new',
    })

    logger.info(`New student enquiry received for Class ${targetClass}: ${targetName} (${targetPhone})`)

    // 1. Notify Administrator via WhatsApp Cloud API (non-blocking)
    const adminWhatsAppAlert = buildAdminNewEnquiryAlert({
      name: targetName,
      parentName: (parentName || '').trim(),
      phone: targetPhone,
      studentClass: targetClass,
      batch: (preferredBatch || 'Evening').trim(),
      school: (school || '').trim(),
      message: (message || '').trim(),
      enquiryId: inquiry._id.toString(),
    })
    notifyAdminWhatsApp(adminWhatsAppAlert).catch(err => {
      logger.error('Failed to dispatch admin WhatsApp alert for new enquiry:', err.message)
    })

    // 2. Notify Administrator via Email if configured (non-blocking)
    if (isEmailConfigured()) {
      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.EMAIL_USER
      if (adminEmail) {
        sendEmail({
          to: adminEmail,
          subject: `📢 New Enquiry: ${targetName} (Class ${targetClass})`,
          html: `<h3>New Admission Enquiry Received</h3>
                 <p><strong>Student Name:</strong> ${targetName}</p>
                 <p><strong>Parent / Guardian:</strong> ${parentName || 'Not specified'}</p>
                 <p><strong>Phone:</strong> ${targetPhone}</p>
                 <p><strong>Class:</strong> Class ${targetClass}</p>
                 <p><strong>Preferred Batch:</strong> ${preferredBatch || 'Evening'}</p>
                 <p><strong>School:</strong> ${school || 'Not specified'}</p>
                 <p><strong>Message:</strong> ${message || 'None'}</p>
                 <p><a href="${(process.env.FRONTEND_URL || 'https://vanita-math-class.vercel.app').replace(/\/+$/, '')}/admin/inquiries">Review in Admin Portal</a></p>`,
        }).catch(err => logger.error('Failed to send admin email alert for new enquiry:', err.message))
      }
    }

    sendResponse(res, 201, {
      id: inquiry._id,
      inquiry,
    }, 'Thank you! Your enquiry has been received. Vanita Math Classes will contact you shortly.')
  } catch (err) {
    next(err)
  }
}

export const getInquiries = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query
    const filter = {}
    if (status) filter.status = status
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { parentName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { school: { $regex: search, $options: 'i' } },
        { class: { $regex: search, $options: 'i' } },
      ]
    }

    const { skip, limit: lim } = paginate(null, page, limit)
    const [inquiries, total] = await Promise.all([
      ContactInquiry.find(filter)
        .populate('enrolledStudentId', 'studentId fullName class batch')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim),
      ContactInquiry.countDocuments(filter),
    ])

    // Generate direct WhatsApp and call links for convenience
    const enriched = inquiries.map(inq => {
      const obj = inq.toObject()
      const greeting = `Hello ${inq.parentName || inq.name}, thank you for your enquiry at Vanita Math Classes for Class ${inq.class}. We would like to share our batch schedule and details.`
      obj.whatsappLink = createDirectWhatsAppLink(inq.phone, greeting)
      obj.callLink = `tel:${inq.phone}`
      return obj
    })

    sendResponse(res, 200, { inquiries: enriched, total, page: parseInt(page), pages: Math.ceil(total / lim) })
  } catch (err) {
    next(err)
  }
}

export const updateInquiryStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    if (!['new', 'contacted', 'enrolled', 'closed'].includes(status)) {
      return next(createError(400, 'Invalid enquiry status'))
    }

    const inquiry = await ContactInquiry.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!inquiry) return next(createError(404, 'Enquiry not found'))

    sendResponse(res, 200, inquiry, 'Enquiry status updated')
  } catch (err) {
    next(err)
  }
}

/**
 * PHASE 3: Admin-Approved Enquiry Admission
 * Enrolls an enquiry directly into a Student account with generated credentials.
 */
export const enrollInquiry = async (req, res, next) => {
  try {
    const { id } = req.params
    const inquiry = await ContactInquiry.findById(id)
    if (!inquiry) return next(createError(404, 'Enquiry record not found'))

    const {
      fullName, studentClass, batch, school, parentName, parentPhone,
      address, monthlyFee, totalFee, discount, admissionDate, notes, sendNotification
    } = req.body

    const targetName = (fullName || inquiry.name).trim()
    const targetClass = (studentClass || inquiry.class).trim()
    const targetBatch = (batch || inquiry.preferredBatch || 'Evening').trim()
    const targetPhone = (parentPhone || inquiry.phone).trim()
    const targetEmail = (inquiry.email || '').trim().toLowerCase()

    // Prevent duplicate student accounts: check phone and name or existing enrolled
    if (inquiry.status === 'enrolled' && inquiry.enrolledStudentId) {
      const existing = await Student.findById(inquiry.enrolledStudentId)
      if (existing) {
        return next(createError(409, `This enquiry has already been enrolled as student ${existing.studentId} (${existing.fullName})`))
      }
    }

    // Check if an existing student already has this exact name & phone in this class
    const duplicate = await Student.findOne({
      fullName: new RegExp(`^${targetName}$`, 'i'),
      class: targetClass,
      $or: [{ phone: targetPhone }, { parentPhone: targetPhone }],
    })
    if (duplicate) {
      return next(createError(409, `A student with this name and phone is already enrolled in Class ${targetClass} (Roll: ${duplicate.studentId}).`))
    }

    // Generate unique credentials: STD<class>-<year>-<seq>, unique username, strong temporary password
    const { studentId, username, tempPassword } = await generateStudentCredentials(targetName, targetClass)

    const accountEmail = targetEmail || `${username}@vanitamaths.local`
    const existingUser = await User.findOne({ email: accountEmail })
    if (existingUser) {
      return next(createError(409, `An account with email ${accountEmail} already exists. Please provide a different email.`))
    }

    // Create User account with mustChangePassword = true
    const user = await User.create({
      name: targetName,
      email: accountEmail,
      phone: targetPhone,
      username,
      password: tempPassword,
      role: 'student',
      status: 'active',
      mustChangePassword: true,
    })

    const mFee = Number(monthlyFee || 0)
    const tFee = Number(totalFee || (mFee > 0 ? mFee * 10 : 0))
    const disc = Number(discount || 0)

    // Create Student record
    const student = await Student.create({
      studentId,
      userId: user._id,
      fullName: targetName,
      email: accountEmail,
      phone: targetPhone,
      class: targetClass,
      batch: targetBatch,
      school: (school || inquiry.school || '').trim(),
      parentName: (parentName || inquiry.parentName || '').trim(),
      parentPhone: targetPhone,
      address: (address || '').trim(),
      admissionDate: admissionDate || new Date(),
      monthlyFee: mFee,
      discount: disc,
      totalFee: Math.max(0, tFee - disc),
      paidFee: 0,
      feeStatus: 'pending',
      status: 'active',
      notes: (notes || inquiry.message || '').trim(),
    })

    // Update enquiry record
    inquiry.status = 'enrolled'
    inquiry.enrolledStudentId = student._id
    inquiry.enrolledAt = new Date()
    await inquiry.save()

    // Build admission message & direct WhatsApp link
    const credMessage = buildAdmissionCredentialsMessage({
      studentName: targetName,
      studentId,
      username,
      tempPassword,
      studentClass: targetClass,
      batch: targetBatch,
    })
    const whatsAppLink = createDirectWhatsAppLink(targetPhone, credMessage)

    // If requested and Meta WhatsApp API is configured, attempt automated send
    let notificationResult = null
    if (sendNotification) {
      try {
        notificationResult = await sendMetaWhatsAppMessage({
          to: targetPhone,
          text: credMessage,
        })
      } catch (err) {
        logger.error('WhatsApp dispatch error during admission:', err.message)
      }
    }

    recordAudit({
      action: 'admission.approve',
      user: req.user,
      targetType: 'Student',
      targetId: student._id,
      description: `Approved enquiry and enrolled student ${targetName} (${studentId}) in Class ${targetClass}`,
      req,
    })

    sendResponse(res, 201, {
      student,
      credentials: {
        studentId,
        username,
        tempPassword,
        mustChangePassword: true,
      },
      whatsAppLink,
      notificationResult,
    }, `Admission approved successfully for ${targetName}! Credentials generated.`)
  } catch (err) {
    next(err)
  }
}
