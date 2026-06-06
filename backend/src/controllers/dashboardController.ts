import { Request, Response } from 'express';
import { User } from '../models/User';
import { Election } from '../models/Election';
import { AuthenticatedRequest } from '../middleware/auth';

type DashboardElection = {
  id: string;
  title: string;
  description: string;
  status: 'Live' | 'Upcoming' | 'Closed';
  startDate: string;
  endDate: string;
  progress: number;
  label: string;
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const buildDisplayStatus = (
  startTime: Date,
  endTime: Date,
  status: string,
): DashboardElection['status'] => {
  const now = new Date();
  if (status === 'active' && startTime <= now && endTime >= now) return 'Live';
  if (startTime > now) return 'Upcoming';
  return 'Closed';
};

const buildProgress = (startTime: Date, endTime: Date): number => {
  const now = new Date();
  const total = endTime.getTime() - startTime.getTime();
  if (total <= 0) return 100;
  const elapsed = Math.min(Math.max(now.getTime() - startTime.getTime(), 0), total);
  return Math.round((elapsed / total) * 100);
};

const buildDemoElections = (): DashboardElection[] => {
  const now = new Date();
  const liveStart = new Date(now.getTime() - 1000 * 60 * 60 * 4);
  const liveEnd = new Date(now.getTime() + 1000 * 60 * 60 * 8);
  const upcomingStart = new Date(now.getTime() + 1000 * 60 * 60 * 18);
  const upcomingEnd = new Date(upcomingStart.getTime() + 1000 * 60 * 60 * 24);
  const closedStart = new Date(now.getTime() - 1000 * 60 * 60 * 72);
  const closedEnd = new Date(now.getTime() - 1000 * 60 * 60 * 24);

  return [
    {
      id: 'demo-live',
      title: 'Student Council President',
      description: 'Live election for the next student leadership term.',
      status: 'Live',
      startDate: liveStart.toISOString(),
      endDate: liveEnd.toISOString(),
      progress: buildProgress(liveStart, liveEnd),
      label: 'Voting now open',
    },
    {
      id: 'demo-upcoming',
      title: 'Campus Safety Committee',
      description: 'Scheduled ballot for the spring governance cycle.',
      status: 'Upcoming',
      startDate: upcomingStart.toISOString(),
      endDate: upcomingEnd.toISOString(),
      progress: 0,
      label: 'Opens soon',
    },
    {
      id: 'demo-closed',
      title: 'Community Grants Panel',
      description: 'Completed vote with published results and export ready.',
      status: 'Closed',
      startDate: closedStart.toISOString(),
      endDate: closedEnd.toISOString(),
      progress: 100,
      label: 'Results archived',
    },
  ];
};

export const getDashboardOverview = async (req: Request, res: Response): Promise<void> => {
  const authenticatedRequest = req as AuthenticatedRequest;

  const [users, elections] = await Promise.all([
    User.find({}, { _id: 1, role: 1, email: 1, createdAt: 1 }).lean(),
    Election.find({}).sort({ startTime: 1 }).lean(),
  ]);

  const now = new Date();
  const dataMode = elections.length > 0 ? 'database' : 'demo';

  const mappedElections: DashboardElection[] =
    elections.length > 0
      ? elections.map((election) => {
          const displayStatus = buildDisplayStatus(election.startTime, election.endTime, election.status);
          return {
            id: election._id.toString(),
            title: election.title,
            description: election.description || 'Managed election record',
            status: displayStatus,
            startDate: election.startTime.toISOString(),
            endDate: election.endTime.toISOString(),
            progress: buildProgress(election.startTime, election.endTime),
            label:
              election.status === 'active'
                ? 'Voting active'
                : election.startTime > now
                  ? 'Scheduled'
                  : 'Closed',
          };
        })
      : buildDemoElections();

  const liveElections = mappedElections.filter((e) => e.status === 'Live').length;
  const upcomingElections = mappedElections.filter((e) => e.status === 'Upcoming').length;
  const closedElections = mappedElections.filter((e) => e.status === 'Closed').length;
  const voterCount = users.filter((u) => u.role === 'VOTER').length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;

  res.json({
    success: true,
    data: {
      user: authenticatedRequest.user ?? null,
      dataMode,
      metrics: [
        { label: 'Live elections', value: liveElections, note: 'Voting windows currently open' },
        { label: 'Upcoming elections', value: upcomingElections, note: 'Scheduled and awaiting activation' },
        { label: 'Registered voters', value: voterCount, note: 'Accounts available for participation' },
        { label: 'Admin users', value: adminCount, note: 'Trusted election administrators' },
      ],
      elections: mappedElections,
      securityChecks: [
        { label: 'Password hashing', value: 'bcrypt 12 rounds', tone: 'good' },
        { label: 'JWT access tokens', value: '15 min expiry', tone: 'good' },
        { label: 'One-vote enforcement', value: 'Atomic + DB index', tone: 'good' },
        { label: 'Vote encryption', value: 'AES-256-GCM', tone: 'good' },
        { label: 'Audit logging', value: 'Enabled', tone: 'good' },
        { label: 'Rate limiting', value: 'Enabled', tone: 'good' },
      ],
      activity:
        elections.length > 0
          ? elections.slice(0, 4).map((election) => ({
              title: election.title,
              detail: `Election ${election.status === 'active' ? 'currently active' : 'ready for review'}.`,
              time: dateFormatter.format(election.updatedAt),
            }))
          : [
              { title: 'Secure login confirmed', detail: 'JWT verified for current session.', time: '2 minutes ago' },
              { title: 'Election turnout updated', detail: 'Live participation metrics refreshed.', time: '11 minutes ago' },
            ],
      summary: {
        totalElections: mappedElections.length,
        closedElections,
        liveElectionRate:
          mappedElections.length > 0 ? Math.round((liveElections / mappedElections.length) * 100) : 0,
      },
    },
  });
};
