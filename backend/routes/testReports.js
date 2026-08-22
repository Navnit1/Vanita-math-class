import { Router } from 'express'
import {
  getTestReports, getMyTestReports, uploadTestReport, downloadTestReport, deleteTestReport,
} from '../controllers/testReportController.js'
import { protect, authorize } from '../middleware/auth.js'
import { uploadTestReport as uploadMiddleware } from '../middleware/upload.js'

const router = Router()
router.use(protect)

router.get('/', authorize('admin', 'teacher'), getTestReports)
router.get('/mine', authorize('student'), getMyTestReports)
router.post('/', authorize('admin', 'teacher'), uploadMiddleware.single('file'), uploadTestReport)
router.get('/:id/download', downloadTestReport)
router.delete('/:id', authorize('admin', 'teacher'), deleteTestReport)

export default router