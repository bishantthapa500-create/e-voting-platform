import { useNavigate } from 'react-router-dom';
import { CalendarDays, BarChart3, Vote, Users } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { CountdownTimer } from './CountdownTimer';

export interface ElectionCardData {
  _id: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'closed';
  startTime: string;
  endTime: string;
  candidates: { _id: string; name: string }[];
}

const fmt = (d: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(new Date(d));

export function ElectionCard({ election }: { election: ElectionCardData }) {
  const navigate = useNavigate();
  const now = new Date();
  const start = new Date(election.startTime);
  const end = new Date(election.endTime);

  return (
    <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/40 p-6 backdrop-blur-xl flex flex-col gap-4 hover:border-white/20 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-white leading-snug line-clamp-2">{election.title}</h3>
        <StatusBadge status={election.status} />
      </div>

      {election.description && (
        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{election.description}</p>
      )}

      {/* Meta */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <CalendarDays className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <span>{fmt(election.startTime)} — {fmt(election.endTime)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Users className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <span>{election.candidates.length} candidate{election.candidates.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Countdown */}
        {election.status === 'active' && end > now && (
          <CountdownTimer targetDate={election.endTime} label="Closes in" />
        )}
        {election.status === 'draft' && start > now && (
          <CountdownTimer targetDate={election.startTime} label="Opens in" />
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-2 border-t border-white/8">
        {election.status === 'active' && (
          <button
            onClick={() => navigate(`/elections/${election._id}`)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-cyan-400 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 transition"
          >
            <Vote className="h-4 w-4" />
            Vote Now
          </button>
        )}
        {(election.status === 'active' || election.status === 'closed') && (
          <button
            onClick={() => navigate(`/results/${election._id}`)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-2 text-sm text-slate-200 hover:bg-white/10 transition"
          >
            <BarChart3 className="h-4 w-4" />
            Results
          </button>
        )}
        {election.status === 'draft' && (
          <button
            onClick={() => navigate(`/elections/${election._id}`)}
            className="flex-1 rounded-full border border-white/10 bg-white/5 py-2 text-sm text-slate-400 hover:bg-white/10 transition"
          >
            Preview
          </button>
        )}
      </div>
    </article>
  );
}
