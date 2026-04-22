import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { requireRole } from '../middleware/requireRole';
import { list } from '../controllers/dentistController';

const router = Router();

router.get('/', verifyToken, requireRole('OFFICE_MANAGER'), list);

export default router;
