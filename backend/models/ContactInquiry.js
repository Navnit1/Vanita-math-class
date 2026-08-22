import mongoose from 'mongoose'

const contactInquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  message: { type: String, required: true, maxlength: 2000 },
  interestedStandard: { type: String, default: '' },
  status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' },
}, { timestamps: true })

contactInquirySchema.index({ status: 1, createdAt: -1 })

export default mongoose.model('ContactInquiry', contactInquirySchema)
