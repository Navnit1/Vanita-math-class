import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import { createError } from '../utils/helpers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

// Maps each allowed MIME type to the ONLY file extension we will accept and
// write to disk for it. We never trust the extension the browser sends on
// file.originalname — a malicious upload can claim mimetype "image/jpeg"
// while naming itself "evil.html", which would otherwise get saved as
// evil.html and served back as a webpage from /uploads (stored XSS).
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
}

const storage = (subfolder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, `../uploads/${subfolder}`)
    ensureDir(dir)
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    // Extension is derived ONLY from the validated mimetype, never from the
    // client-supplied original filename.
    const ext = MIME_TO_EXT[file.mimetype] || ''
    cb(null, `${uuidv4()}${ext}`)
  },
})

const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype) && MIME_TO_EXT[file.mimetype]) {
    cb(null, true)
  } else {
    cb(createError(400, `Invalid file type. Allowed: ${allowedTypes.join(', ')}`), false)
  }
}


export const uploadReceipt = multer({
  storage: storage('receipts'),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: fileFilter([
    'image/jpeg', 'image/jpg', 'image/png', 'application/pdf',
  ]),
})

export const uploadMaterial = multer({
  storage: storage('materials'),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB — PPT files can be large
  fileFilter: fileFilter([
    'application/pdf',
    // Word documents
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // PowerPoint
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Images
    'image/jpeg', 'image/jpg', 'image/png',
  ]),
})

export const uploadProfile = multer({
  storage: storage('profiles'),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: fileFilter(['image/jpeg', 'image/jpg', 'image/png']),
})
export const uploadTestReport = multer({
  storage: storage('test-reports'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter(['application/pdf']),
})