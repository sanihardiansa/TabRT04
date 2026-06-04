import express from 'express';
import {
  getAuditLogs,
  getAuditLogById,
  getTableAuditHistory,
} from '../controllers/auditController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(authorize('admin'));

router.get('/', getAuditLogs);
router.get('/:id', getAuditLogById);
router.get('/table/:table/:recordId', getTableAuditHistory);

export default router;
