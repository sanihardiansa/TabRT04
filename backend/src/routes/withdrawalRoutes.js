import express from 'express';
import {
  createWithdrawal,
  getWithdrawals,
  approveWithdrawal,
} from '../controllers/withdrawalController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';
import { validateRequest } from '../utils/validation.js';
import { schemas } from '../utils/validation.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', validateRequest(schemas.createWithdrawal), createWithdrawal);
router.get('/', getWithdrawals);
router.put('/:id/approve', authorize('admin', 'treasurer'), validateRequest(schemas.approveWithdrawal), approveWithdrawal);

export default router;
