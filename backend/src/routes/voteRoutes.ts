import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import { castVote, getVoteStatus } from '../controllers/voteController';

const router = Router();

router.post('/', authenticate, asyncHandler(castVote));
router.get('/status/:electionId', authenticate, asyncHandler(getVoteStatus));

export default router;
