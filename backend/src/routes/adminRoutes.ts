import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  listUsers,
  changeUserRole,
  deactivateUser,
  getAuditLogs,
  getStats,
  exportElectionCsv,
} from '../controllers/adminController';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, requireAdmin);

router.get('/users', asyncHandler(listUsers));
router.patch('/users/:id/role', asyncHandler(changeUserRole));
router.delete('/users/:id', asyncHandler(deactivateUser));

router.get('/logs', asyncHandler(getAuditLogs));
router.get('/stats', asyncHandler(getStats));

router.get('/elections/:id/export', asyncHandler(exportElectionCsv));

export default router;
