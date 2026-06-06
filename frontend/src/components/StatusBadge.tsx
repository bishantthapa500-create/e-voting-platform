type Status = 'draft' | 'active' | 'closed' | 'Live' | 'Upcoming' | 'Closed';

const styles: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25',
  Live:   'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25',
  draft:  'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25',
  Upcoming: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25',
  closed: 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-400/20',
  Closed: 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-400/20',
};

const labels: Record<string, string> = {
  active: '● Live', Live: '● Live',
  draft: 'Draft', Upcoming: 'Upcoming',
  closed: 'Closed', Closed: 'Closed',
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${styles[status] ?? styles['closed']}`}>
      {labels[status] ?? status}
    </span>
  );
}
