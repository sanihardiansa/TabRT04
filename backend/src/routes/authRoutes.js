import express from 'express';
import { login, register, getCurrentUser } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../utils/validation.js';
import { schemas } from '../utils/validation.js';

const router = express.Router();

router.post('/register', validateRequest(schemas.register), register);
router.post('/login', validateRequest(schemas.login), login);
router.get('/me', authenticateToken, getCurrentUser);

export default router;
