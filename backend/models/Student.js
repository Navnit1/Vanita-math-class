import mongoose from 'mongoose'

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true }, // Roll number / Unique ID e.g. STD8-2026-001
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  class: { type: String, required: true, trim: true }, // '8th', '9th', '10th', '+1', '+2'
  section: { type: String, default: '' },
  batch: { type: String, required: true, trim: true }, // 'Morning', 'Evening', 'Weekend'
  school: { type: String, trim: true, default: '' },
  academicYear: { type: String, default: () => String(new Date().getFullYear()) },
  course: { type: String, default: 'Mathematics' },
  parentName: { type: String, trim: true, default: '' },
  parentPhone: { type: String, trim: true, default: '' },
  address: { type: String, default: '' },
  dateOfBirth: { type: Date },
  admissionDate: { type: Date, default: Date.now },
  profilePhoto: { type: String, default: null },
  status: { type: String, enum: ['active', 'inactive', 'graduated'], default: 'active' },
  monthlyFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalFee: { type: Number, default: 0 },
  paidFee: { type: Number, default: 0 },
  feePlan: { type: String, enum: ['monthly', 'quarterly', 'yearly'], default: 'monthly' },
  feeStatus: { type: String, enum: ['paid', 'partial', 'pending', 'overdue'], default: 'pending' },
  notes: { type: String, default: '' },
}, { timestamps: true })

studentSchema.index({ class: 1, batch: 1 })
studentSchema.index({ class: 1, status: 1 })

studentSchema.virtual('pendingFee').get(function () {
  return Math.max(0, (this.totalFee || 0) - (this.paidFee || 0))
})

studentSchema.set('toJSON', { virtuals: true })
studentSchema.set('toObject', { virtuals: true })

export default mongoose.model('Student', studentSchema)
