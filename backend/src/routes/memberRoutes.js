import express from 'express';
import {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deactivateMember,
} from '../controllers/memberController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';
import { validateRequest } from '../utils/validation.js';
import { schemas } from '../utils/validation.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getAllMembers);
router.get('/:id', getMemberById);
router.post('/', authorize('admin', 'treasurer'), validateRequest(schemas.createMember), createMember);
router.put('/:id', authorize('admin', 'treasurer'), validateRequest(schemas.updateMember), updateMember);
router.delete('/:id', authorize('admin'), deactivateMember);

export default router;
