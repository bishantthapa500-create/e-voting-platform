import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck, Vote, BarChart3, LockKeyhole,
  BadgeCheck, Activity, ArrowRight, Fingerprint,
} from 'lucide-react';
import { ElectionCard, type ElectionCardData } from '../components/ElectionCard';
import { CardSkeleton } from '../components/Skeleton';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: LockKeyhole,
    title: 'AES-256-GCM encryption',
    desc: 'Every vote is encrypted before storage. Keys never leave the server.',
  },
  {
    icon: BadgeCheck,
    title: 'One-person-one-vote',
    desc: 'Atomic database transactions with a unique index prevent double voting.',
  },
  {
    icon: BarChart3,
    title: 'Live results',
    desc: 'Results update every 5 seconds during active elections.',
  },
  {
    icon: Activity,
    title: 'Full audit trail',
    desc: 'Every mutating action is logged with IP, user, and timestamp.',
  },
  {
    icon: ShieldCheck,
    title: 'JWT + OTP auth',
    desc: 'Short-lived access tokens, rotating refresh tokens, email OTP verification.',
  },
  {
    icon: Fingerprint,
    title: 'Anonymous ballots',
    desc: 'Voter IDs are HMAC-hashed — your vote cannot be traced back to you.',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const { data: elections, isLoading } = useQuery({
    queryKey: ['publicElections'],
    queryFn: () =>
      api.get<{ data: ElectionCardData[] }>('/elections?status=active').then((r) => r.data.data),
    // Only fetch if logged in — guests see the feature section only
    enabled: !!accessToken,
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.22),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.15),_transparent_30%),linear-gradient(180deg,_#04111f_0%,_#081827_50%,_#0a1524_100%)] text-slate-100">

      {/* Nav */}
      <nav className="sticky top-0 z-20 border-b border-white/8 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-200">
              <Vote className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-white">Secure E-Voting</span>
          </div>
          <div className="flex items-center gap-3">
            {accessToken ? (
              <>
                <button onClick={() => navigate('/elections')} className="text-sm text-slate-300 hover:text-white transition">Elections</button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 transition"
                >
                  Dashboard
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="text-sm text-slate-300 hover:text-white transition">Sign in</button>
                <button
                  onClick={() => navigate('/register')}
                  className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 transition"
                >
                  Get started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-200 mb-8">
          <ShieldCheck className="h-4 w-4" />
          Production-ready secure voting infrastructure
        </span>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.08] mb-6">
          Democracy,{' '}
          <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            engineered
          </span>{' '}
          to be trusted.
        </h1>

        <p className="max-w-2xl mx-auto text-lg text-slate-400 leading-relaxed mb-10">
          End-to-end encrypted ballots, real-time results, full audit trails, and
          OTP-verified voter identities — all in one platform.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => navigate(accessToken ? '/elections' : '/register')}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-7 py-3.5 text-base font-semibold text-slate-950 hover:bg-cyan-300 transition shadow-lg shadow-cyan-400/20"
          >
            {accessToken ? 'Browse elections' : 'Create your account'}
            <ArrowRight className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition"
          >
            Sign in
          </button>
        </div>
      </section>

      {/* Features grid */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-white mb-10">
          Security you can audit
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-[1.75rem] border border-white/10 bg-slate-950/40 p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200 ring-1 ring-white/10">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Active elections (only if logged in) */}
      {accessToken && (
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Active elections</h2>
            <button onClick={() => navigate('/elections')} className="text-sm text-cyan-300 hover:text-cyan-200 transition">
              View all →
            </button>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <CardSkeleton /><CardSkeleton /><CardSkeleton />
            </div>
          ) : !elections?.length ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-12 text-center text-slate-500">
              No active elections right now.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {elections.map((e) => <ElectionCard key={e._id} election={e} />)}
            </div>
          )}
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-white/8 py-8 text-center text-sm text-slate-600">
        Secure E-Voting Platform · Built with Node.js, MongoDB, React
      </footer>
    </div>
  );
}
