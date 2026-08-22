import mongoose from 'mongoose'

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String },
  class: { type: String, required: true }, // e.g. "6th" .. "10th"
  section: { type: String, default: '' }, // e.g. "A", "B"
  batch: { type: String, required: true }, // e.g. "Morning", "Evening"
  academicYear: { type: String, default: () => String(new Date().getFullYear()) }, // e.g. "2026"
  course: { type: String },
  parentName: { type: String, trim: true },
  parentPhone: { type: String },
  address: { type: String },
  dateOfBirth: { type: Date },
  admissionDate: { type: Date, default: Date.now },
  profilePhoto: { type: String, default: null },
  status: { type: String, enum: ['active', 'inactive', 'graduated'], default: 'active' },
  totalFee: { type: Number, default: 0 },
  paidFee: { type: Number, default: 0 },
  feePlan: { type: String, enum: ['monthly', 'quarterly', 'yearly'], default: 'monthly' },
  feeStatus: { type: String, enum: ['paid', 'partial', 'pending', 'overdue'], default: 'pending' },
  notes: { type: String },
}, { timestamps: true })

studentSchema.index({ class: 1, batch: 1 })
studentSchema.index({ class: 1, status: 1 })

studentSchema.virtual('pendingFee').get(function () {
  return Math.max(0, this.totalFee - this.paidFee)
})

studentSchema.set('toJSON', { virtuals: true })
studentSchema.set('toObject', { virtuals: true })

export default mongoose.model('Student', studentSchema)
