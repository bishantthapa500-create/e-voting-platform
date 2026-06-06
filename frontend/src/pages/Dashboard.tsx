import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck, Vote, BarChart3, Activity,
  LogOut, UserRound, Sparkles, Settings,
  CalendarDays, ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ElectionCard, type ElectionCardData } from '../components/ElectionCard';
import { CardSkeleton, Skeleton } from '../components/Skeleton';

interface Stats {
  totalElections: number;
  activeElections: number;
  totalVotes: number;
  turnoutPct: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const { data: elections, isLoading: electionsLoading } = useQuery({
    queryKey: ['dashboardElections'],
    queryFn: () =>
      api.get<{ data: ElectionCardData[] }>('/elections').then((r) => r.data.data),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () =>
      api.get<{ data: Stats }>('/admin/stats').then((r) => r.data.data),
    enabled: isAdmin,
  });

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate('/login');
  };

  const activeElections = elections?.filter((e) => e.status === 'active') ?? [];
  const upcomingElections = elections?.filter((e) => e.status === 'draft') ?? [];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.22),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.15),_transparent_25%),linear-gradient(180deg,_#04111f_0%,_#081827_48%,_#0a1524_100%)] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <header className="sticky top-4 z-20 rounded-3xl border border-white/10 bg-white/7 px-5 py-4 backdrop-blur-xl shadow-[0_20px_80px_rgba(2,8,23,0.35)] mb-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-cyan-200/70">Secure E-Voting</p>
                <h1 className="text-lg font-semibold text-white">
                  Welcome back, {user?.name ?? 'Voter'}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300">
                <UserRound className="h-4 w-4" />
                {user?.email}
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold
                ${user?.role === 'ADMIN' ? 'bg-cyan-400/15 text-cyan-200' : 'bg-slate-400/10 text-slate-300'}`}>
                <Sparkles className="h-3.5 w-3.5" />
                {user?.role}
              </span>
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/15 transition"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Admin Panel
                </button>
              )}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/15 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="space-y-8">

          {/* Admin stats strip */}
          {isAdmin && (
            <section>
              {statsLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
                </div>
              ) : stats ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total elections', value: stats.totalElections, icon: CalendarDays },
                    { label: 'Active now', value: stats.activeElections, icon: Vote },
                    { label: 'Votes cast', value: stats.totalVotes, icon: Activity },
                    { label: 'Turnout', value: `${stats.turnoutPct}%`, icon: BarChart3 },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                        <span>{label}</span>
                        <Icon className="h-4 w-4 text-cyan-300/70" />
                      </div>
                      <div className="text-2xl font-bold text-white">{value}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          )}

          {/* Quick actions */}
          <section className="grid gap-4 sm:grid-cols-3">
            <Link to="/elections"
              className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 hover:border-cyan-400/30 hover:bg-white/8 transition group">
              <Vote className="h-6 w-6 text-cyan-300 mb-3" />
              <h3 className="font-semibold text-white mb-1">Browse Elections</h3>
              <p className="text-sm text-slate-400">View and vote in active elections</p>
              <ArrowRight className="h-4 w-4 text-cyan-300 mt-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to={`/elections`}
              className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 hover:border-emerald-400/30 hover:bg-white/8 transition group">
              <BarChart3 className="h-6 w-6 text-emerald-300 mb-3" />
              <h3 className="font-semibold text-white mb-1">Live Results</h3>
              <p className="text-sm text-slate-400">Track real-time vote counts</p>
              <ArrowRight className="h-4 w-4 text-emerald-300 mt-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            {isAdmin ? (
              <Link to="/admin"
                className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 hover:border-amber-400/30 hover:bg-white/8 transition group">
                <Settings className="h-6 w-6 text-amber-300 mb-3" />
                <h3 className="font-semibold text-white mb-1">Admin Panel</h3>
                <p className="text-sm text-slate-400">Manage elections, users, logs</p>
                <ArrowRight className="h-4 w-4 text-amber-300 mt-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
                <ShieldCheck className="h-6 w-6 text-slate-500 mb-3" />
                <h3 className="font-semibold text-white mb-1">Your Votes</h3>
                <p className="text-sm text-slate-400">Anonymous and encrypted</p>
              </div>
            )}
          </section>

          {/* Active elections */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Active Elections</h2>
              <Link to="/elections" className="text-sm text-cyan-300 hover:text-cyan-200 transition">View all →</Link>
            </div>

            {electionsLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <CardSkeleton /><CardSkeleton /><CardSkeleton />
              </div>
            ) : activeElections.length === 0 ? (
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center text-slate-500">
                <Vote className="h-8 w-8 mx-auto mb-3 opacity-30" />
                No active elections right now. Check back soon.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeElections.map((e) => <ElectionCard key={e._id} election={e} />)}
              </div>
            )}
          </section>

          {/* Upcoming elections */}
          {upcomingElections.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Upcoming Elections</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingElections.map((e) => <ElectionCard key={e._id} election={e} />)}
              </div>
            </section>
          )}

        </main>
      </div>
    </div>
  );
}
