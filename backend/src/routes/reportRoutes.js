import express from 'express';
import {
  getDashboard,
  getReport,
  getMemberReport,
} from '../controllers/reportController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/dashboard', getDashboard);
router.get('/summary', authorize('admin', 'treasurer'), getReport);
router.get('/member/:memberId', getMemberReport);

export default router;
