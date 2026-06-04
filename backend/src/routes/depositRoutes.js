import express from 'express';
import {
  createDeposit,
  getDeposits,
  getDepositById,
} from '../controllers/depositController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';
import { validateRequest } from '../utils/validation.js';
import { schemas } from '../utils/validation.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', authorize('admin', 'treasurer'), validateRequest(schemas.createDeposit), createDeposit);
router.get('/', getDeposits);
router.get('/:id', getDepositById);

export default router;
