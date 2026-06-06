import { Request, Response } from 'express';
import prisma from '../config/prisma';
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

const buildElectionStatus = (startDate: Date, endDate: Date, isActive: boolean): DashboardElection['status'] => {
  const now = new Date();

  if (isActive && startDate <= now && endDate >= now) {
    return 'Live';
  }

  if (startDate > now) {
    return 'Upcoming';
  }

  return 'Closed';
};

const buildProgress = (startDate: Date, endDate: Date): number => {
  const now = new Date();
  const total = endDate.getTime() - startDate.getTime();

  if (total <= 0) {
    return 100;
  }

  const elapsed = Math.min(Math.max(now.getTime() - startDate.getTime(), 0), total);
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

const buildDemoActivities = () => [
  {
    title: 'Secure login confirmed',
    detail: 'OTP and JWT verification completed for the current session.',
    time: '2 minutes ago',
  },
  {
    title: 'Election turnout updated',
    detail: 'Live participation metrics refreshed for the active ballot.',
    time: '11 minutes ago',
  },
  {
    title: 'Audit log synced',
    detail: 'Recent admin activity was written to the secure activity stream.',
    time: '1 hour ago',
  },
];

export const getDashboardOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const authenticatedRequest = req as AuthenticatedRequest;

    const [users, elections] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          role: true,
          email: true,
          createdAt: true,
        },
      }),
      prisma.election.findMany({
        orderBy: {
          startDate: 'asc',
        },
      }),
    ]);

    const now = new Date();
    const dataMode = elections.length > 0 ? 'database' : 'demo';
    const mappedElections: DashboardElection[] =
      elections.length > 0
        ? elections.map((election) => ({
            id: election.id,
            title: election.title,
            description: election.description || 'Managed election record',
            status: buildElectionStatus(election.startDate, election.endDate, election.isActive),
            startDate: election.startDate.toISOString(),
            endDate: election.endDate.toISOString(),
            progress: buildProgress(election.startDate, election.endDate),
            label: election.isActive ? 'Voting active' : election.startDate > now ? 'Scheduled' : 'Closed',
          }))
        : buildDemoElections();

    const liveElections = mappedElections.filter((election) => election.status === 'Live').length;
    const upcomingElections = mappedElections.filter((election) => election.status === 'Upcoming').length;
    const closedElections = mappedElections.filter((election) => election.status === 'Closed').length;
    const voterCount = users.filter((user) => user.role === 'VOTER').length;
    const adminCount = users.filter((user) => user.role !== 'VOTER').length;

    const securityChecks = [
      { label: 'Password hashing', value: 'Enabled', tone: 'good' },
      { label: 'JWT session control', value: 'Enabled', tone: 'good' },
      { label: 'One-vote enforcement', value: 'Planned', tone: 'warn' },
      { label: 'Activity logging', value: 'Enabled', tone: 'good' },
    ];

    const response = {
      user: authenticatedRequest.user ?? null,
      dataMode,
      metrics: [
        {
          label: 'Live elections',
          value: liveElections,
          note: 'Voting windows currently open',
        },
        {
          label: 'Upcoming elections',
          value: upcomingElections,
          note: 'Scheduled and awaiting activation',
        },
        {
          label: 'Registered voters',
          value: voterCount,
          note: 'Accounts available for participation',
        },
        {
          label: 'Admin users',
          value: adminCount,
          note: 'Trusted election administrators',
        },
      ],
      elections: mappedElections,
      securityChecks,
      activity:
        elections.length > 0
          ? elections.slice(0, 4).map((election) => ({
              title: election.title,
              detail: `Election stored in the secure database and ${election.isActive ? 'currently active' : 'ready for review'}.`,
              time: dateFormatter.format(election.updatedAt),
            }))
          : buildDemoActivities(),
      summary: {
        totalElections: mappedElections.length,
        closedElections,
        liveElectionRate: mappedElections.length > 0 ? Math.round((liveElections / mappedElections.length) * 100) : 0,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Failed to load dashboard overview' });
  }
};