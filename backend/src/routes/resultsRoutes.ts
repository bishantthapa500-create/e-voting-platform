import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import { getResults } from '../controllers/resultsController';

const router = Router();

router.get('/:electionId', authenticate, asyncHandler(getResults));

export default router;
