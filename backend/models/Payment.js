import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  feeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fee' },
  amount: { type: Number, required: true, min: 1 },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'bank_transfer', 'cheque', 'demand_draft', 'online'],
    required: true,
  },
  paymentDate: { type: Date, required: true, default: Date.now },
  receiptNumber: { type: String, required: true },
  receiptImage: { type: String, default: null },
  notes: { type: String },
  month: { type: String },

  // Payment type: online (Razorpay) or offline (admin entry)
  paymentType: { type: String, enum: ['online', 'offline'], default: 'offline' },

  // Razorpay fields (online payments only)
  transactionId: { type: String, default: null },
  gatewayOrderId: { type: String, default: null },
  gatewayPaymentId: { type: String, default: null },

  // Approval
  approvalStatus: { type: String, enum: ['pending', 'approved', 'failed'], default: 'pending' },

  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  status: { type: String, enum: ['recorded', 'verified'], default: 'recorded' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

paymentSchema.index({ studentId: 1, paymentDate: -1 })
paymentSchema.index({ receiptNumber: 1 })
paymentSchema.index({ gatewayOrderId: 1 })
// Prevents the same Razorpay payment from ever being recorded twice, even
// under a race condition (two near-simultaneous verify requests).
paymentSchema.index(
  { gatewayPaymentId: 1 },
  { unique: true, partialFilterExpression: { gatewayPaymentId: { $type: 'string' } } }
)
paymentSchema.index({ paymentType: 1 })

export default mongoose.model('Payment', paymentSchema)
