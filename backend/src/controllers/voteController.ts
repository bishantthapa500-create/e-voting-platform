import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Election } from '../models/Election';
import { Vote } from '../models/Vote';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import { hashVoterId, encryptVote } from '../utils/encryption';
import { sendVoteConfirmation } from '../services/emailService';

// ─── Cast Vote ────────────────────────────────────────────────────────────────
export const castVote = async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthenticatedRequest).user!;
  const { electionId, candidateId } = req.body as { electionId?: string; candidateId?: string };

  if (!electionId || !candidateId) {
    res.status(400).json({ success: false, message: 'electionId and candidateId are required' });
    return;
  }

  if (!mongoose.isValidObjectId(electionId) || !mongoose.isValidObjectId(candidateId)) {
    res.status(400).json({ success: false, message: 'Invalid electionId or candidateId' });
    return;
  }

  const election = await Election.findById(electionId);
  if (!election) {
    res.status(404).json({ success: false, message: 'Election not found' });
    return;
  }

  const now = new Date();
  if (election.status !== 'active' || election.startTime > now || election.endTime < now) {
    res.status(400).json({ success: false, message: 'Voting is not currently open for this election' });
    return;
  }

  const candidate = election.candidates.find((c) => c._id.toString() === candidateId);
  if (!candidate) {
    res.status(404).json({ success: false, message: 'Candidate not found in this election' });
    return;
  }

  // Anonymous voter hash — cannot be reversed to find the voter
  const voterHash = hashVoterId(user.userId, electionId);

  // Encrypt a vote receipt for audit purposes
  const encryptedPayload = encryptVote(
    JSON.stringify({ voterId: user.userId, electionId, candidateId, timestamp: now.toISOString() }),
  );

  // Use a MongoDB session to atomically: create Vote + increment count + mark hasVoted
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // This will throw if the unique index (voterHash, electionId) is violated
      await Vote.create([{ voterHash, electionId, candidateId, encryptedPayload, timestamp: now }], { session });

      await Election.updateOne(
        { _id: electionId, 'candidates._id': candidateId },
        { $inc: { 'candidates.$.voteCount': 1 } },
        { session },
      );

      await User.updateOne(
        { _id: user.userId },
        { $set: { [`hasVoted.${electionId}`]: true } },
        { session },
      );
    });
  } catch (err: unknown) {
    const mongoErr = err as { code?: number };
    if (mongoErr?.code === 11000) {
      res.status(409).json({ success: false, message: 'You have already voted in this election' });
      return;
    }
    throw err;
  } finally {
    await session.endSession();
  }

  // Send confirmation email — non-blocking
  const dbUser = await User.findById(user.userId).lean();
  if (dbUser) {
    sendVoteConfirmation(dbUser.email, election.title).catch((e) =>
      console.error('Vote confirmation email error:', e),
    );
  }

  res.status(201).json({ success: true, message: 'Your vote has been recorded' });
};

// ─── Vote Status ──────────────────────────────────────────────────────────────
export const getVoteStatus = async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthenticatedRequest).user!;
  const { electionId } = req.params;

  if (!mongoose.isValidObjectId(electionId)) {
    res.status(400).json({ success: false, message: 'Invalid election ID' });
    return;
  }

  const voterHash = hashVoterId(user.userId, electionId);
  const vote = await Vote.findOne({ voterHash, electionId }).lean();

  res.json({ success: true, data: { hasVoted: !!vote } });
};
