import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Vote } from 'lucide-react';
import api from '../services/api';
import { ElectionCard, type ElectionCardData } from '../components/ElectionCard';
import { CardSkeleton } from '../components/Skeleton';
import { StatusBadge } from '../components/StatusBadge';

type StatusFilter = 'all' | 'active' | 'draft' | 'closed';

export default function ElectionsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<StatusFilter>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['elections'],
    queryFn: () => api.get<{ data: ElectionCardData[] }>('/elections').then((r) => r.data.data),
  });

  const elections = (data ?? []).filter((e) => filter === 'all' || e.status === filter);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#04111f_0%,_#0a1524_100%)] text-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Elections</h1>
            <p className="text-sm text-slate-400 mt-1">Browse and participate in elections</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="text-sm text-cyan-300 hover:text-cyan-200 self-start sm:self-auto">
            ← Dashboard
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['all', 'active', 'draft', 'closed'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition
                ${filter === s
                  ? 'bg-cyan-400 text-slate-950'
                  : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}
            >
              {s === 'all' ? 'All' : <><StatusBadge status={s} /><span className="sr-only">{s}</span></>}
              {s === 'all' && ' elections'}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <CardSkeleton /><CardSkeleton /><CardSkeleton />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">
            Failed to load elections. Please try again.
          </div>
        ) : elections.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-14 text-center text-slate-400">
            <Vote className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No {filter !== 'all' ? filter : ''} elections found.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {elections.map((e) => <ElectionCard key={e._id} election={e} />)}
          </div>
        )}
      </div>
    </div>
  );
}
