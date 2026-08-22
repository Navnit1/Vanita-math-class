import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import { createError } from '../utils/helpers.js'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Maps each allowed MIME type to a Cloudinary "resource_type". Images use
// Cloudinary's image pipeline; everything else (PDFs, Word, PPT) is stored
// as a "raw" file so Cloudinary doesn't try to transform it.
const MIME_TO_RESOURCE_TYPE = {
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'application/pdf': 'raw',
  'application/msword': 'raw',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'raw',
  'application/vnd.ms-powerpoint': 'raw',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'raw',
}

const storage = (subfolder) => new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: `vanita-maths/${subfolder}`,
    resource_type: MIME_TO_RESOURCE_TYPE[file.mimetype] || 'raw',
    public_id: undefined,
  }),
})

const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype) && MIME_TO_RESOURCE_TYPE[file.mimetype]) {
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
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: fileFilter([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
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

export { cloudinary }