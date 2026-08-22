import mongoose from 'mongoose'

const feeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  feeType: { type: String, enum: ['monthly', 'quarterly', 'annual', 'registration', 'exam', 'other'], default: 'monthly' },
  amount: { type: Number, required: true, min: 0 },
  dueDate: { type: Date, required: true },
  month: { type: String }, // e.g. "June 2025"
  paymentStatus: { type: String, enum: ['paid', 'partial', 'pending', 'overdue'], default: 'pending' },
  paidAmount: { type: Number, default: 0 },
  remarks: { type: String },
  receiptNumber: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

feeSchema.index({ studentId: 1, month: 1 })
feeSchema.index({ paymentStatus: 1 })
feeSchema.index({ dueDate: 1 })

export default mongoose.model('Fee', feeSchema)
