import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { requireRole } from '../middleware/requireRole';
import { list, create } from '../controllers/surgeryController';

const router = Router();

router.get('/', verifyToken, list);
router.post('/', verifyToken, requireRole('OFFICE_MANAGER'), create);

export default router;
