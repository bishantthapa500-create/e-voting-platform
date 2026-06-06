import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, AlertCircle, UserRound, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

interface Candidate { _id: string; name: string; party?: string; bio?: string; photoUrl?: string; voteCount: number; }
interface Election {
  _id: string; title: string; description?: string;
  status: 'draft' | 'active' | 'closed';
  startTime: string; endTime: string; candidates: Candidate[];
}

const fmt = (d: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(d));

export default function ElectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const { data: election, isLoading } = useQuery({
    queryKey: ['election', id],
    queryFn: () => api.get<{ data: Election }>(`/elections/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: voteStatus } = useQuery({
    queryKey: ['voteStatus', id],
    queryFn: () =>
      api.get<{ data: { hasVoted: boolean } }>(`/vote/status/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  const castVoteMutation = useMutation({
    mutationFn: () =>
      api.post('/vote', { electionId: id, candidateId: selected }),
    onSuccess: () => {
      toast.success('Vote cast successfully!');
      qc.invalidateQueries({ queryKey: ['voteStatus', id] });
      setConfirming(false);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to cast vote';
      toast.error(msg);
      setConfirming(false);
    },
  });

  if (isLoading || !election) {
    return (
      <Shell navigate={navigate}>
        <div className="h-64 rounded-[2rem] bg-white/5 animate-pulse" />
      </Shell>
    );
  }

  const hasVoted = voteStatus?.hasVoted ?? false;
  const canVote = election.status === 'active' && !hasVoted;

  return (
    <Shell navigate={navigate}>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{election.title}</h1>
              {election.description && <p className="mt-2 text-slate-400">{election.description}</p>}
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-cyan-400" /> {fmt(election.startTime)} – {fmt(election.endTime)}</span>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide
              ${election.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' :
                election.status === 'draft' ? 'bg-amber-500/15 text-amber-300' :
                'bg-slate-500/15 text-slate-300'}`}>
              {election.status}
            </span>
          </div>
        </div>

        {/* Already voted */}
        {hasVoted && (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 flex items-center gap-3 text-emerald-100">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>You have already cast your vote in this election.</span>
          </div>
        )}

        {/* Voting closed */}
        {election.status === 'closed' && (
          <div className="rounded-2xl border border-slate-400/20 bg-slate-500/10 p-4 flex items-center gap-3 text-slate-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>This election is closed. View the results below.</span>
          </div>
        )}

        {/* Candidates */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Candidates</h2>
          {election.candidates.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
              No candidates added yet.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {election.candidates.map((c) => (
                <label
                  key={c._id}
                  className={`flex items-start gap-4 rounded-2xl border p-4 cursor-pointer transition
                    ${canVote ? 'hover:border-cyan-400/40 hover:bg-white/5' : 'cursor-default'}
                    ${selected === c._id ? 'border-cyan-400/50 bg-cyan-400/5' : 'border-white/10 bg-slate-950/30'}`}
                >
                  {canVote && (
                    <input
                      type="radio"
                      name="candidate"
                      value={c._id}
                      checked={selected === c._id}
                      onChange={() => setSelected(c._id)}
                      className="mt-1 accent-cyan-400"
                      aria-label={`Vote for ${c.name}`}
                    />
                  )}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-slate-300 shrink-0">
                      {c.photoUrl ? (
                        <img src={c.photoUrl} alt={c.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <UserRound className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{c.name}</p>
                      {c.party && <p className="text-xs text-slate-400">{c.party}</p>}
                      {c.bio && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.bio}</p>}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Cast Vote Button */}
        {canVote && selected && !confirming && (
          <button
            onClick={() => setConfirming(true)}
            className="w-full rounded-2xl bg-cyan-400 py-3 font-semibold text-slate-950 hover:bg-cyan-300 transition"
          >
            Cast Vote
          </button>
        )}

        {/* Confirmation Modal */}
        {confirming && (
          <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/5 p-6 space-y-4">
            <p className="text-white font-semibold">Confirm your vote?</p>
            <p className="text-sm text-slate-400">
              You are voting for <strong className="text-white">{election.candidates.find((c) => c._id === selected)?.name}</strong>. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => castVoteMutation.mutate()}
                disabled={castVoteMutation.isPending}
                className="flex-1 rounded-full bg-cyan-400 py-2.5 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60 transition"
              >
                {castVoteMutation.isPending ? 'Submitting...' : 'Confirm Vote'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-full border border-white/10 bg-white/5 py-2.5 font-semibold text-slate-200 hover:bg-white/10 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {(election.status === 'active' || election.status === 'closed') && (
          <button
            onClick={() => navigate(`/results/${id}`)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-slate-200 hover:bg-white/10 transition"
          >
            View Live Results →
          </button>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children, navigate }: { children: React.ReactNode; navigate: ReturnType<typeof useNavigate> }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#04111f_0%,_#0a1524_100%)] text-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <button onClick={() => navigate('/elections')} className="text-sm text-cyan-300 hover:text-cyan-200 mb-6 inline-block">
          ← All Elections
        </button>
        {children}
      </div>
    </div>
  );
}
