import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: { type: String, unique: true, sparse: true, lowercase: true, trim: true, index: true },
  phone: { type: String, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['admin', 'student'], default: 'student' },
  profilePhoto: { type: String, default: null },
  status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active' },
  mustChangePassword: { type: Boolean, default: false },
  refreshToken: { type: String, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  resetPasswordOtpHash: { type: String, select: false },
  resetPasswordOtpExpires: { type: Date, select: false },
  resetPasswordOtpAttempts: { type: Number, default: 0, select: false },
  lastOtpSentAt: { type: Date, select: false },
  lastLogin: { type: Date },
}, { timestamps: true })

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.refreshToken
  delete obj.passwordResetToken
  delete obj.passwordResetExpires
  delete obj.resetPasswordOtpHash
  delete obj.resetPasswordOtpExpires
  delete obj.resetPasswordOtpAttempts
  delete obj.lastOtpSentAt
  return obj
}

export default mongoose.model('User', userSchema)
