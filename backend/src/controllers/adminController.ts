import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Election } from '../models/Election';
import { Vote } from '../models/Vote';
import { AuditLog } from '../models/AuditLog';

// ─── User List ────────────────────────────────────────────────────────────────
export const listUsers = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, Number(req.query['page']) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 20));
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find({}, '-passwordHash -otpCode -otpExpiry -refreshTokens')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(),
  ]);

  res.json({ success: true, data: { users, total, page, limit } });
};

// ─── Change Role ──────────────────────────────────────────────────────────────
export const changeUserRole = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { role } = req.body as { role?: string };

  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ success: false, message: 'Invalid user ID' });
    return;
  }

  if (!['VOTER', 'ADMIN'].includes(role ?? '')) {
    res.status(400).json({ success: false, message: 'Role must be VOTER or ADMIN' });
    return;
  }

  const user = await User.findByIdAndUpdate(id, { role }, { new: true, select: '-passwordHash' });
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  res.json({ success: true, data: user });
};

// ─── Deactivate User ──────────────────────────────────────────────────────────
export const deactivateUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ success: false, message: 'Invalid user ID' });
    return;
  }

  const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  res.json({ success: true, message: 'User deactivated' });
};

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, Number(req.query['page']) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (req.query['userId']) filter['userId'] = req.query['userId'];
  if (req.query['action']) filter['action'] = new RegExp(String(req.query['action']), 'i');
  if (req.query['from'] || req.query['to']) {
    filter['timestamp'] = {
      ...(req.query['from'] ? { $gte: new Date(String(req.query['from'])) } : {}),
      ...(req.query['to'] ? { $lte: new Date(String(req.query['to'])) } : {}),
    };
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email')
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  res.json({ success: true, data: { logs, total, page, limit } });
};

// ─── Stats Dashboard ──────────────────────────────────────────────────────────
export const getStats = async (req: Request, res: Response): Promise<void> => {
  const [
    totalUsers,
    totalVoters,
    totalAdmins,
    totalElections,
    activeElections,
    closedElections,
    totalVotes,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'VOTER' }),
    User.countDocuments({ role: 'ADMIN' }),
    Election.countDocuments(),
    Election.countDocuments({ status: 'active' }),
    Election.countDocuments({ status: 'closed' }),
    Vote.countDocuments(),
  ]);

  const turnoutPct = totalVoters > 0 ? Math.round((totalVotes / totalVoters) * 100 * 10) / 10 : 0;

  res.json({
    success: true,
    data: {
      totalUsers,
      totalVoters,
      totalAdmins,
      totalElections,
      activeElections,
      closedElections,
      totalVotes,
      turnoutPct,
    },
  });
};

// ─── CSV Export ───────────────────────────────────────────────────────────────
const csvEscape = (value: string): string => {
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
};

export const exportElectionCsv = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ success: false, message: 'Invalid election ID' });
    return;
  }

  const election = await Election.findById(id).lean();
  if (!election) {
    res.status(404).json({ success: false, message: 'Election not found' });
    return;
  }

  const now = new Date();
  const totalVotes = election.candidates.reduce((s, c) => s + c.voteCount, 0);

  const rows: string[] = [
    ['candidate_id', 'name', 'party', 'vote_count', 'percentage'].join(','),
  ];

  for (const c of election.candidates) {
    const pct = totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(1) : '0.0';
    rows.push(
      [
        csvEscape(c._id.toString()),
        csvEscape(c.name),
        csvEscape(c.party ?? ''),
        String(c.voteCount),
        pct,
      ].join(','),
    );
  }

  const filename = `election-${id}-results-${now.toISOString().slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('X-Report-Generated-At', now.toISOString());
  res.send(rows.join('\n') + '\n');
};
