import { Router } from 'express'
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, markAnnouncementRead } from '../controllers/announcementController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = Router()
router.use(protect)

router.get('/', getAnnouncements)
router.post('/', authorize('admin', 'teacher'), createAnnouncement)
router.put('/:id/read', markAnnouncementRead)
router.put('/:id', authorize('admin', 'teacher'), updateAnnouncement)
router.delete('/:id', authorize('admin'), deleteAnnouncement)

export default router
