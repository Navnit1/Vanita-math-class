import mongoose from 'mongoose'

const teacherSchema = new mongoose.Schema({
  teacherId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String },
  subjects: [{ type: String }],
  batches: [{ type: String }],
  qualification: { type: String },
  salary: { type: Number, default: 0 },
  joiningDate: { type: Date, default: Date.now },
  profilePhoto: { type: String, default: null },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  address: { type: String },
  notes: { type: String },
}, { timestamps: true })

export default mongoose.model('Teacher', teacherSchema)
