import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { requireRole } from '../middleware/requireRole';
import { login, register } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/register', verifyToken, requireRole('OFFICE_MANAGER'), register);

export default router;
