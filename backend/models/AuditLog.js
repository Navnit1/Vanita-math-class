import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g. 'student.create', 'attendance.mark', 'announcement.delete'
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  performedByName: { type: String },
  performedByRole: { type: String },
  targetType: { type: String }, // e.g. 'Student', 'Announcement', 'Fee'
  targetId: { type: mongoose.Schema.Types.ObjectId },
  description: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
}, { timestamps: true })

auditLogSchema.index({ createdAt: -1 })
auditLogSchema.index({ performedBy: 1, createdAt: -1 })
auditLogSchema.index({ targetType: 1, targetId: 1 })

export default mongoose.model('AuditLog', auditLogSchema)
