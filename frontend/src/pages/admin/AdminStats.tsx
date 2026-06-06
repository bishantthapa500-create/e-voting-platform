import { useQuery } from '@tanstack/react-query';
import { Users, Vote, BarChart3, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

interface Stats {
  totalUsers: number; totalVoters: number; totalAdmins: number;
  totalElections: number; activeElections: number; closedElections: number;
  totalVotes: number; turnoutPct: number;
}

const cards = (s: Stats) => [
  { label: 'Total Users', value: s.totalUsers, icon: Users, color: 'text-cyan-300' },
  { label: 'Registered Voters', value: s.totalVoters, icon: Users, color: 'text-emerald-300' },
  { label: 'Total Elections', value: s.totalElections, icon: Vote, color: 'text-amber-300' },
  { label: 'Active Elections', value: s.activeElections, icon: BarChart3, color: 'text-emerald-300' },
  { label: 'Total Votes Cast', value: s.totalVotes, icon: ShieldCheck, color: 'text-purple-300' },
  { label: 'Turnout', value: `${s.turnoutPct}%`, icon: BarChart3, color: 'text-cyan-300' },
];

export default function AdminStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => api.get<{ data: Stats }>('/admin/stats').then((r) => r.data.data),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard Stats</h1>
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {cards(data).map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div className="text-3xl font-bold text-white">{value}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
