import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  createElection,
  listElections,
  getElection,
  updateElection,
  deleteElection,
  addCandidate,
  updateCandidate,
  removeCandidate,
} from '../controllers/electionController';

const router = Router();

router.get('/', authenticate, asyncHandler(listElections));
router.get('/:id', authenticate, asyncHandler(getElection));
router.post('/', authenticate, requireAdmin, asyncHandler(createElection));
router.patch('/:id', authenticate, requireAdmin, asyncHandler(updateElection));
router.delete('/:id', authenticate, requireAdmin, asyncHandler(deleteElection));

router.post('/:id/candidates', authenticate, requireAdmin, asyncHandler(addCandidate));
router.patch('/:id/candidates/:cid', authenticate, requireAdmin, asyncHandler(updateCandidate));
router.delete('/:id/candidates/:cid', authenticate, requireAdmin, asyncHandler(removeCandidate));

export default router;
