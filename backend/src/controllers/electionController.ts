import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Election } from '../models/Election';
import { AuthenticatedRequest } from '../middleware/auth';

// ─── Create Election ──────────────────────────────────────────────────────────
export const createElection = async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthenticatedRequest).user!;
  const { title, description, startTime, endTime } = req.body as {
    title?: string; description?: string; startTime?: string; endTime?: string;
  };

  if (!title?.trim() || !startTime || !endTime) {
    res.status(400).json({ success: false, message: 'Title, startTime and endTime are required' });
    return;
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    res.status(400).json({ success: false, message: 'Invalid date format' });
    return;
  }

  if (end <= start) {
    res.status(400).json({ success: false, message: 'endTime must be after startTime' });
    return;
  }

  const election = await Election.create({
    title: title.trim(),
    description: description?.trim(),
    startTime: start,
    endTime: end,
    status: 'draft',
    createdBy: user.userId,
    candidates: [],
  });

  res.status(201).json({ success: true, data: election });
};

// ─── List Elections ───────────────────────────────────────────────────────────
export const listElections = async (req: Request, res: Response): Promise<void> => {
  const { status } = req.query as { status?: string };
  const filter: Record<string, unknown> = {};
  if (status) filter['status'] = status;

  const elections = await Election.find(filter)
    .sort({ startTime: 1 })
    .populate('createdBy', 'name email')
    .lean();

  res.json({ success: true, data: elections });
};

// ─── Get Single Election ──────────────────────────────────────────────────────
export const getElection = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ success: false, message: 'Invalid election ID' });
    return;
  }

  const election = await Election.findById(id)
    .populate('createdBy', 'name email')
    .lean();

  if (!election) {
    res.status(404).json({ success: false, message: 'Election not found' });
    return;
  }

  res.json({ success: true, data: election });
};

// ─── Update Election ──────────────────────────────────────────────────────────
export const updateElection = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ success: false, message: 'Invalid election ID' });
    return;
  }

  const allowed = ['title', 'description', 'startTime', 'endTime', 'status'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const election = await Election.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

  if (!election) {
    res.status(404).json({ success: false, message: 'Election not found' });
    return;
  }

  res.json({ success: true, data: election });
};

// ─── Soft Delete Election ─────────────────────────────────────────────────────
export const deleteElection = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ success: false, message: 'Invalid election ID' });
    return;
  }

  const election = await Election.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

  if (!election) {
    res.status(404).json({ success: false, message: 'Election not found' });
    return;
  }

  res.json({ success: true, message: 'Election deleted' });
};

// ─── Add Candidate ────────────────────────────────────────────────────────────
export const addCandidate = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ success: false, message: 'Invalid election ID' });
    return;
  }

  const { name, party, bio, photoUrl } = req.body as {
    name?: string; party?: string; bio?: string; photoUrl?: string;
  };

  if (!name?.trim()) {
    res.status(400).json({ success: false, message: 'Candidate name is required' });
    return;
  }

  const election = await Election.findByIdAndUpdate(
    id,
    {
      $push: {
        candidates: { name: name.trim(), party, bio, photoUrl, voteCount: 0 },
      },
    },
    { new: true },
  );

  if (!election) {
    res.status(404).json({ success: false, message: 'Election not found' });
    return;
  }

  res.status(201).json({ success: true, data: election });
};

// ─── Update Candidate ─────────────────────────────────────────────────────────
export const updateCandidate = async (req: Request, res: Response): Promise<void> => {
  const { id, cid } = req.params;

  const election = await Election.findOneAndUpdate(
    { _id: id, 'candidates._id': cid },
    {
      $set: {
        'candidates.$.name': req.body.name,
        'candidates.$.party': req.body.party,
        'candidates.$.bio': req.body.bio,
        'candidates.$.photoUrl': req.body.photoUrl,
      },
    },
    { new: true },
  );

  if (!election) {
    res.status(404).json({ success: false, message: 'Election or candidate not found' });
    return;
  }

  res.json({ success: true, data: election });
};

// ─── Remove Candidate ─────────────────────────────────────────────────────────
export const removeCandidate = async (req: Request, res: Response): Promise<void> => {
  const { id, cid } = req.params;

  const election = await Election.findByIdAndUpdate(
    id,
    { $pull: { candidates: { _id: cid } } },
    { new: true },
  );

  if (!election) {
    res.status(404).json({ success: false, message: 'Election not found' });
    return;
  }

  res.json({ success: true, data: election });
};
