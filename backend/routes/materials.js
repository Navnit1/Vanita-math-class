import { Router } from 'express'
import { getMaterials, uploadMaterial, downloadMaterial, deleteMaterial } from '../controllers/materialController.js'
import { protect, authorize } from '../middleware/auth.js'
import { uploadMaterial as uploadMiddleware } from '../middleware/upload.js'

const router = Router()
router.use(protect)

router.get('/', getMaterials)
router.post('/', authorize('admin', 'teacher'), uploadMiddleware.single('file'), uploadMaterial)
router.get('/:id/download', downloadMaterial)
router.delete('/:id', authorize('admin', 'teacher'), deleteMaterial)

export default router
