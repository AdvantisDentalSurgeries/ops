import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { requireRole } from '../middleware/requireRole';
import { list, book, cancel, reschedule } from '../controllers/appointmentController';

const router = Router();

router.get('/', verifyToken, list);
router.post('/', verifyToken, requireRole('OFFICE_MANAGER'), book);
router.put('/:id/cancel', verifyToken, requireRole('DENTIST', 'PATIENT'), cancel);
router.put('/:id/reschedule', verifyToken, requireRole('DENTIST', 'PATIENT'), reschedule);

export default router;
