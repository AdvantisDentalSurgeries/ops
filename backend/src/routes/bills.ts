import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { requireRole } from '../middleware/requireRole';
import { getByPatient, pay } from '../controllers/billController';

const router = Router();

router.get('/:patientId', verifyToken, requireRole('PATIENT', 'OFFICE_MANAGER'), getByPatient);
router.put('/:id/pay', verifyToken, requireRole('OFFICE_MANAGER'), pay);

export default router;
