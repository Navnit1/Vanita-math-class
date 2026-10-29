import mongoose from 'mongoose'

const contactInquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 }, // student or contact name
  parentName: { type: String, trim: true, default: '' },
  email: { type: String, lowercase: true, trim: true, default: '' },
  phone: { type: String, required: true, trim: true },
  class: { type: String, required: true, trim: true }, // '8th', '9th', '10th', '+1', '+2'
  school: { type: String, trim: true, default: '' },
  preferredBatch: { type: String, trim: true, default: 'Evening' },
  message: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['new', 'contacted', 'enrolled', 'closed'], default: 'new' },
  enrolledStudentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
  enrolledAt: { type: Date, default: null },
}, { timestamps: true })

contactInquirySchema.index({ status: 1, createdAt: -1 })
contactInquirySchema.index({ phone: 1 })

export default mongoose.model('ContactInquiry', contactInquirySchema)
