import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { getDashboardOverview } from '../controllers/dashboardController';
import { createElection, exportElectionReportCsv } from '../controllers/electionController';

const router = Router();

router.get('/overview', authenticate, getDashboardOverview);
router.post('/elections', authenticate, requireAdmin, createElection);
router.get('/report/export', authenticate, requireAdmin, exportElectionReportCsv);

export default router;