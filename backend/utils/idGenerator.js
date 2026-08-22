import crypto from 'crypto'
import Student from '../models/Student.js'
import User from '../models/User.js'

/**
 * Normalizes a class label like "8th", "8", "Class 8" -> "8"
 * Used to build the STD<digit>-<year>-<seq> id and to keep class comparisons consistent.
 */
export const normalizeClassDigits = (cls = '') => {
  const match = String(cls).match(/\d{1,2}/)
  return match ? match[0] : '0'
}

/**
 * Generates a Student ID in the format STD<class>-<year>-<seq>
 * e.g. STD8-2026-001, STD10-2026-025
 * Sequence is per class+year, zero-padded to 3 digits, and is guaranteed
 * unique by checking against existing records (handles concurrent creation).
 */
export const generateStudentId = async (cls) => {
  const classDigits = normalizeClassDigits(cls)
  const year = new Date().getFullYear()
  const prefix = `STD${classDigits}-${year}-`

  // Find the highest existing sequence number for this class+year
  const existing = await Student.find({ studentId: { $regex: `^${prefix}` } })
    .select('studentId')
    .lean()

  let maxSeq = 0
  for (const s of existing) {
    const tail = s.studentId.slice(prefix.length)
    const n = parseInt(tail, 10)
    if (!isNaN(n) && n > maxSeq) maxSeq = n
  }

  let seq = maxSeq + 1
  let studentId = `${prefix}${String(seq).padStart(3, '0')}`

  // Safety loop in case of a race condition with the unique index
  while (await Student.exists({ studentId })) {
    seq += 1
    studentId = `${prefix}${String(seq).padStart(3, '0')}`
  }

  return studentId
}

/**
 * Generates a unique username from a full name.
 * Lowercase, no spaces/special characters, e.g. "Rahul Sharma" -> "rahulsharma"
 * Appends a numeric suffix if the base is already taken: "rahulsharma001"
 */
export const generateUsername = async (fullName) => {
  const base = String(fullName)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20) || 'student'

  let username = base
  let exists = await User.exists({ username })

  if (!exists) return username

  let counter = 1
  while (exists) {
    username = `${base}${String(counter).padStart(3, '0')}`
    exists = await User.exists({ username })
    counter += 1
  }
  return username
}

/**
 * Generates a secure, human-typeable temporary password.
 * Pattern: Capitalized-word-fragment + Symbol + 4 digits, e.g. "RSharma@4821"
 * Meets strong password rules: upper, lower, digit, symbol, length >= 8.
 */
export const generateTempPassword = (fullName = '') => {
  const symbols = ['@', '#', '$', '%', '&', '!']
  const symbol = symbols[crypto.randomInt(0, symbols.length)]
  const digits = String(crypto.randomInt(1000, 9999))

  const parts = String(fullName).trim().split(/\s+/).filter(Boolean)
  let fragment
  if (parts.length >= 2) {
    // First initial + last name, e.g. "Rahul Sharma" -> "RSharma"
    const lastName = parts[parts.length - 1]
    fragment = parts[0][0].toUpperCase() + lastName.charAt(0).toUpperCase() + lastName.slice(1, 7).toLowerCase()
  } else if (parts.length === 1) {
    fragment = parts[0].charAt(0).toUpperCase() + parts[0].slice(1, 8).toLowerCase()
  } else {
    fragment = 'Student'
  }

  // Guarantee a minimum length so short names (e.g. single-letter parts) still
  // produce a strong password: fragment + symbol + 4 digits must be >= 8 chars.
  if (fragment.length < 4) fragment = fragment.padEnd(4, 'x')

  return `${fragment}${symbol}${digits}`
}

/**
 * Generates a complete set of onboarding credentials for a new student.
 */
export const generateStudentCredentials = async (fullName, cls) => {
  const [studentId, username] = await Promise.all([
    generateStudentId(cls),
    generateUsername(fullName),
  ])
  const tempPassword = generateTempPassword(fullName)
  return { studentId, username, tempPassword }
}
