import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy } from 'lucide-react';
import api from '../services/api';

interface CandidateResult {
  id: string; name: string; party?: string; voteCount: number; percentage: number;
}
interface ResultsData {
  election: { id: string; title: string; status: string; startTime: string; endTime: string; };
  totalVotes: number;
  results: CandidateResult[];
}

const COLORS = ['#22d3ee', '#34d399', '#a78bfa', '#fb923c', '#f472b6'];

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['results', id],
    queryFn: () => api.get<{ data: ResultsData }>(`/results/${id}`).then((r) => r.data.data),
    enabled: !!id,
    // Poll every 5 seconds if election is active
    refetchInterval: (query) => query.state.data?.election.status === 'active' ? 5000 : false,
  });

  if (isLoading) {
    return <Shell navigate={navigate}><div className="h-64 rounded-[2rem] bg-white/5 animate-pulse" /></Shell>;
  }

  if (error) {
    return (
      <Shell navigate={navigate}>
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">
          Failed to load results.
        </div>
      </Shell>
    );
  }

  const { election, totalVotes, results } = data!;
  const winner = results[0];

  return (
    <Shell navigate={navigate}>
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{election.title}</h1>
              <p className="mt-1 text-slate-400 text-sm">{totalVotes} total votes</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase
              ${election.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-500/15 text-slate-300'}`}>
              {election.status === 'active' ? '● Live' : 'Closed'}
            </span>
          </div>
        </div>

        {/* Winner banner */}
        {winner && election.status === 'closed' && (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 flex items-center gap-3">
            <Trophy className="h-6 w-6 text-amber-300 shrink-0" />
            <div>
              <p className="font-semibold text-amber-100">Winner: {winner.name}</p>
              <p className="text-sm text-amber-200/70">{winner.voteCount} votes ({winner.percentage}%)</p>
            </div>
          </div>
        )}

        {/* Bar Chart */}
        {results.length > 0 && (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Vote Distribution</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={results} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                  labelStyle={{ color: '#f1f5f9' }}
                  itemStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="voteCount" radius={[6, 6, 0, 0]}>
                  {results.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Table */}
        <div className="rounded-[2rem] border border-white/10 bg-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="px-5 py-3 text-left font-medium">Candidate</th>
                <th className="px-5 py-3 text-right font-medium">Votes</th>
                <th className="px-5 py-3 text-right font-medium">%</th>
              </tr>
            </thead>
            <tbody>
              {results.map((c, i) => (
                <tr key={c.id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3 text-white">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      {c.name}
                      {c.party && <span className="text-slate-500 text-xs">({c.party})</span>}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-white">{c.voteCount}</td>
                  <td className="px-5 py-3 text-right text-slate-400">{c.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children, navigate }: { children: React.ReactNode; navigate: ReturnType<typeof useNavigate> }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#04111f_0%,_#0a1524_100%)] text-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <button onClick={() => navigate(-1)} className="text-sm text-cyan-300 hover:text-cyan-200 mb-6 inline-block">
          ← Back
        </button>
        {children}
      </div>
    </div>
  );
}
