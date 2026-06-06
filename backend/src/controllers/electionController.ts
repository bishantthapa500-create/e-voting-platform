import { Request, Response } from 'express';
import { Election } from '../models/Election';

const isValidDate = (value: unknown): value is Date => value instanceof Date && !Number.isNaN(value.getTime());

const csvEscape = (value: string): string => {
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
};

type ElectionCreateBody = {
  title?: unknown;
  description?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  isActive?: unknown;
};

export const createElection = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = (req.body ?? {}) as ElectionCreateBody;

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : undefined;
    const startDateRaw = body.startDate;
    const endDateRaw = body.endDate;
    const isActive = typeof body.isActive === 'boolean' ? body.isActive : false;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    if (!startDateRaw || !endDateRaw) {
      res.status(400).json({ error: 'Start date and end date are required' });
      return;
    }

    const startDate = new Date(String(startDateRaw));
    const endDate = new Date(String(endDateRaw));

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      res.status(400).json({ error: 'Start date and end date must be valid dates' });
      return;
    }

    if (endDate.getTime() <= startDate.getTime()) {
      res.status(400).json({ error: 'End date must be after start date' });
      return;
    }

    const election = await Election.create({
      title,
      description: description || undefined,
      startDate,
      endDate,
      isActive,
    });

    res.status(201).json({ message: 'Election created', election });
  } catch (error) {
    console.error('Create election error:', error);
    res.status(500).json({ error: 'Failed to create election' });
  }
};

export const exportElectionReportCsv = async (req: Request, res: Response): Promise<void> => {
  try {
    const elections = await Election.find({}).sort({ startDate: 1 }).lean();

    const now = new Date();

    const rows: string[] = [];
    rows.push(
      [
        'election_id',
        'title',
        'description',
        'start_date',
        'end_date',
        'is_active',
        'status',
        'created_at',
        'updated_at',
      ].join(','),
    );

    for (const election of elections) {
      const status =
        election.isActive && election.startDate <= now && election.endDate >= now
          ? 'Live'
          : election.startDate > now
            ? 'Upcoming'
            : 'Closed';

      rows.push(
        [
          csvEscape(election._id.toString()),
          csvEscape(election.title),
          csvEscape(election.description ?? ''),
          csvEscape(election.startDate.toISOString()),
          csvEscape(election.endDate.toISOString()),
          String(election.isActive),
          status,
          csvEscape(election.createdAt.toISOString()),
          csvEscape(election.updatedAt.toISOString()),
        ].join(','),
      );
    }

    const dateStamp = now.toISOString().slice(0, 10);
    const filename = `election-report-${dateStamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Report-Generated-At', now.toISOString());

    res.send(`${rows.join('\n')}\n`);
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
};
