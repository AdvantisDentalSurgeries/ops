import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { requireRole } from '../middleware/requireRole';
import { list, create } from '../controllers/requestController';

const router = Router();

router.get('/', verifyToken, requireRole('OFFICE_MANAGER'), list);
router.post('/', verifyToken, requireRole('PATIENT'), create);

export default router;
