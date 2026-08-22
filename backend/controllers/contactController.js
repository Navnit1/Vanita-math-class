import ContactInquiry from '../models/ContactInquiry.js'
import { sendResponse, createError, paginate } from '../utils/helpers.js'
import logger from '../utils/logger.js'

export const submitInquiry = async (req, res, next) => {
  try {
    const { name, email, phone, message, interestedStandard } = req.body
    if (!name || !email || !message) {
      return next(createError(400, 'Name, email, and message are required'))
    }

    const inquiry = await ContactInquiry.create({ name, email, phone, message, interestedStandard })
    logger.info(`New contact inquiry from: ${email}`)

    sendResponse(res, 201, { id: inquiry._id }, 'Thanks for reaching out! We will get back to you shortly.')
  } catch (err) {
    next(err)
  }
}

export const getInquiries = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const filter = {}
    if (status) filter.status = status

    const { skip, limit: lim } = paginate(null, page, limit)
    const [inquiries, total] = await Promise.all([
      ContactInquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim),
      ContactInquiry.countDocuments(filter),
    ])

    sendResponse(res, 200, { inquiries, total, page: parseInt(page), pages: Math.ceil(total / lim) })
  } catch (err) {
    next(err)
  }
}

export const updateInquiryStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    const inquiry = await ContactInquiry.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!inquiry) return next(createError(404, 'Inquiry not found'))
    sendResponse(res, 200, inquiry, 'Inquiry updated')
  } catch (err) {
    next(err)
  }
}
