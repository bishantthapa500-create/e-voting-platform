import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Election } from '../models/Election';

export const getResults = async (req: Request, res: Response): Promise<void> => {
  const { electionId } = req.params;

  if (!mongoose.isValidObjectId(electionId)) {
    res.status(400).json({ success: false, message: 'Invalid election ID' });
    return;
  }

  const election = await Election.findById(electionId).lean();

  if (!election) {
    res.status(404).json({ success: false, message: 'Election not found' });
    return;
  }

  if (election.status === 'draft') {
    res.status(403).json({ success: false, message: 'Results are not available for draft elections' });
    return;
  }

  const totalVotes = election.candidates.reduce((sum, c) => sum + c.voteCount, 0);

  const results = election.candidates
    .map((c) => ({
      id: c._id,
      name: c.name,
      party: c.party,
      photoUrl: c.photoUrl,
      voteCount: c.voteCount,
      percentage: totalVotes > 0 ? Math.round((c.voteCount / totalVotes) * 100 * 10) / 10 : 0,
    }))
    .sort((a, b) => b.voteCount - a.voteCount);

  res.json({
    success: true,
    data: {
      election: {
        id: election._id,
        title: election.title,
        status: election.status,
        startTime: election.startTime,
        endTime: election.endTime,
      },
      totalVotes,
      results,
    },
  });
};
