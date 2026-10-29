import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createError } from '../utils/helpers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, '..', 'uploads')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
)

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

const MIME_TO_RESOURCE_TYPE = {
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'application/pdf': 'raw',
  'application/msword': 'raw',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'raw',
  'application/vnd.ms-powerpoint': 'raw',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'raw',
}

const getStorage = (subfolder) => {
  if (isCloudinaryConfigured) {
    return new CloudinaryStorage({
      cloudinary,
      params: async (req, file) => ({
        folder: `vanita-maths/${subfolder}`,
        resource_type: MIME_TO_RESOURCE_TYPE[file.mimetype] || 'raw',
        public_id: undefined,
      }),
    })
  }

  // Local fallback storage
  const targetDir = path.join(uploadsDir, subfolder)
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, targetDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname)
      const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_')
      cb(null, `${name}-${Date.now()}${ext}`)
    },
  })
}

const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(createError(400, `Invalid file type: ${file.mimetype}. Allowed: ${allowedTypes.join(', ')}`), false)
  }
}

export const uploadReceipt = multer({
  storage: getStorage('receipts'),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
  fileFilter: fileFilter([
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf',
  ]),
})

export const uploadMaterial = multer({
  storage: getStorage('materials'),
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: fileFilter([
    'application/pdf',
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
})

export const uploadProfile = multer({
  storage: getStorage('profiles'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
})

export const uploadTestReport = multer({
  storage: getStorage('test-reports'),
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: fileFilter([
    'application/pdf',
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  ]),
})

export { cloudinary, isCloudinaryConfigured }
