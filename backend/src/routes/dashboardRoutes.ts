// Legacy dashboard route — kept for backward compatibility with the existing frontend.
// New routes live in /api/elections, /api/vote, /api/results, /api/admin
import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { getDashboardOverview } from '../controllers/dashboardController';
import { createElection } from '../controllers/electionController';
import { exportElectionCsv } from '../controllers/adminController';

const router = Router();

router.get('/overview', authenticate, asyncHandler(getDashboardOverview));
router.post('/elections', authenticate, requireAdmin, asyncHandler(createElection));
// Export now delegates to the unified admin export
router.get('/report/export/:id', authenticate, requireAdmin, asyncHandler(exportElectionCsv));

export default router;
