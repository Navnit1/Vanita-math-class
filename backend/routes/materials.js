import { Router } from 'express'
import {
  getMaterials,
  uploadMaterial,
  updateMaterial,
  viewNote,
  deleteMaterial,
} from '../controllers/materialController.js'
import { protect, authorize } from '../middleware/auth.js'
import { uploadMaterial as uploadMiddleware } from '../middleware/upload.js'

const router = Router()
router.use(protect)

router.get('/', getMaterials)
router.post('/', authorize('admin'), uploadMiddleware.single('file'), uploadMaterial)
router.put('/:id', authorize('admin'), uploadMiddleware.single('file'), updateMaterial)
router.get('/:id/view', viewNote)
router.get('/:id/download', viewNote) // download alias also streams directly
router.delete('/:id', authorize('admin'), deleteMaterial)

export default router
