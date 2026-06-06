import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BellRing,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleCheckBig,
  FileDown,
  Fingerprint,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  ShieldCheck,
  Sparkles,
  UserRound,
  Vote,
  Wifi,
} from 'lucide-react';
import api from '../services/api';

type Metric = {
  label: string;
  value: number;
  note: string;
};

type Election = {
  id: string;
  title: string;
  description: string;
  status: 'Live' | 'Upcoming' | 'Closed';
  startDate: string;
  endDate: string;
  progress: number;
  label: string;
};

type SecurityCheck = {
  label: string;
  value: string;
  tone: 'good' | 'warn';
};

type ActivityItem = {
  title: string;
  detail: string;
  time: string;
};

type DashboardResponse = {
  user: {
    userId: string;
    role: string;
    email?: string;
  } | null;
  dataMode: 'database' | 'demo';
  metrics: Metric[];
  elections: Election[];
  securityChecks: SecurityCheck[];
  activity: ActivityItem[];
  summary: {
    totalElections: number;
    closedElections: number;
    liveElectionRate: number;
  };
};

const statusStyles = {
  Live: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25',
  Upcoming: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25',
  Closed: 'bg-slate-500/15 text-slate-200 ring-1 ring-slate-400/20',
} as const;

const featureCards = [
  {
    title: 'One-person-one-vote',
    detail: 'Session control and vote locking keep the ballot unique per user.',
    icon: BadgeCheck,
  },
  {
    title: 'Encrypted storage',
    detail: 'Vote records are prepared for encrypted persistence and audit trails.',
    icon: LockKeyhole,
  },
  {
    title: 'Real-time results',
    detail: 'Live election status and turnout can be monitored from one screen.',
    icon: BarChart3,
  },
  {
    title: 'Activity logs',
    detail: 'Recent actions are surfaced for oversight and operational review.',
    icon: Activity,
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateElection, setShowCreateElection] = useState(false);
  const [createStatus, setCreateStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message?: string }>({
    type: 'idle',
  });
  const [exportStatus, setExportStatus] = useState<{ type: 'idle' | 'loading' | 'error'; message?: string }>({
    type: 'idle',
  });
  const [electionForm, setElectionForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    isActive: false,
  });

  const fetchDashboard = async () => {
    const response = await api.get('/dashboard/overview');
    setData(response.data);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await fetchDashboard();
      } catch (requestError: any) {
        const statusCode = requestError?.response?.status;

        if (statusCode === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }

        setError(requestError?.response?.data?.error || 'Unable to load the dashboard right now.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null') as { email?: string; role?: string } | null;
    } catch {
      return null;
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isAdmin = (user?.role || data?.user?.role) && (user?.role || data?.user?.role) !== 'VOTER';

  const handleCreateElectionClick = () => {
    if (!isAdmin) {
      setCreateStatus({ type: 'error', message: 'Admin access is required to create elections.' });
      return;
    }

    setCreateStatus({ type: 'idle' });
    setShowCreateElection((prev) => !prev);
  };

  const handleCreateElectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateStatus({ type: 'loading' });

    try {
      if (!electionForm.title.trim()) {
        setCreateStatus({ type: 'error', message: 'Please enter an election title.' });
        return;
      }

      if (!electionForm.startDate || !electionForm.endDate) {
        setCreateStatus({ type: 'error', message: 'Please set both a start and end time.' });
        return;
      }

      const start = new Date(electionForm.startDate);
      const end = new Date(electionForm.endDate);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        setCreateStatus({ type: 'error', message: 'Start and end times must be valid.' });
        return;
      }

      if (end.getTime() <= start.getTime()) {
        setCreateStatus({ type: 'error', message: 'End time must be after start time.' });
        return;
      }

      await api.post('/dashboard/elections', {
        title: electionForm.title.trim(),
        description: electionForm.description.trim() || undefined,
        startDate: electionForm.startDate,
        endDate: electionForm.endDate,
        isActive: electionForm.isActive,
      });

      await fetchDashboard();
      setCreateStatus({ type: 'success', message: 'Election created successfully.' });
      setElectionForm({ title: '', description: '', startDate: '', endDate: '', isActive: false });
      setShowCreateElection(false);
    } catch (requestError: any) {
      setCreateStatus({
        type: 'error',
        message: requestError?.response?.data?.error || 'Failed to create the election.',
      });
    }
  };

  const handleExportReport = async () => {
    if (!isAdmin) {
      setExportStatus({ type: 'error', message: 'Admin access is required to export reports.' });
      return;
    }

    setExportStatus({ type: 'loading' });

    try {
      const response = await api.get('/dashboard/report/export', {
        responseType: 'blob',
        headers: {
          Accept: 'text/csv',
        },
      });

      const contentDisposition = String(response.headers?.['content-disposition'] || '');
      const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
      const filename = filenameMatch?.[1] || 'election-report.csv';

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setExportStatus({ type: 'idle' });
    } catch (requestError: any) {
      setExportStatus({
        type: 'error',
        message: requestError?.response?.data?.error || 'Failed to export the report.',
      });
    }
  };

  const heroStats = data?.summary
    ? [
        { label: 'Election rooms', value: data.summary.totalElections },
        { label: 'Closed ballots', value: data.summary.closedElections },
        { label: 'Live rate', value: `${data.summary.liveElectionRate}%` },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.28),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.20),_transparent_25%),linear-gradient(180deg,_#04111f_0%,_#081827_48%,_#0a1524_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-20 rounded-3xl border border-white/10 bg-white/7 px-5 py-4 backdrop-blur-xl shadow-[0_20px_80px_rgba(2,8,23,0.35)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">Secure E-Voting Command Center</p>
                <h1 className="text-xl font-semibold text-white sm:text-2xl">Election dashboard and live oversight</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-cyan-100">
                <Sparkles className="h-4 w-4" />
                {data?.dataMode === 'database' ? 'Database connected' : 'Demo dashboard active'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200">
                <UserRound className="h-4 w-4" />
                {user?.email || data?.user?.email || 'Authenticated user'}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/10 px-4 py-2 font-medium text-rose-100 transition hover:bg-rose-500/15"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 py-6">
          {loading ? (
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-12 rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-200 backdrop-blur-xl">
                Loading dashboard data...
              </div>
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100 shadow-lg shadow-rose-950/10">
              {error}
            </div>
          ) : data ? (
            <div className="space-y-6">
              <section className="grid gap-6 lg:grid-cols-12">
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_24px_90px_rgba(2,8,23,0.3)] backdrop-blur-xl lg:col-span-8 lg:p-8">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(34,197,94,0.12),_transparent_30%)]" />
                  <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-2xl space-y-4">
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-100">
                        <Wifi className="h-4 w-4" />
                        Secure session authenticated and ready
                      </span>
                      <div className="space-y-3">
                        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                          Monitor elections, protect ballots, and keep trust visible.
                        </h2>
                        <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                          This dashboard brings together election status, voter activity, and security posture so admins can manage voting without losing sight of transparency.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={handleCreateElectionClick}
                          className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={!isAdmin}
                        >
                          Create election
                          <ArrowRight className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleExportReport}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={!isAdmin || exportStatus.type === 'loading'}
                        >
                          {exportStatus.type === 'loading' ? 'Exporting...' : 'Export report'}
                          <FileDown className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid min-w-[240px] grid-cols-3 gap-3 rounded-3xl border border-white/10 bg-slate-950/40 p-4">
                      {heroStats.map((item) => (
                        <div key={item.label} className="rounded-2xl bg-white/5 p-4 text-center">
                          <div className="text-2xl font-semibold text-white">{item.value}</div>
                          <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:col-span-4">
                  <div className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6 shadow-lg shadow-slate-950/15 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Platform health</p>
                        <h3 className="mt-2 text-lg font-semibold text-white">Security status</h3>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-200">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                    </div>

                    <div className="mt-5 space-y-3 text-sm">
                      <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                        <span className="text-slate-300">Authentication</span>
                        <span className="inline-flex items-center gap-1 text-emerald-300">
                          <CheckCircle2 className="h-4 w-4" />
                          Active
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                        <span className="text-slate-300">Access control</span>
                        <span className="inline-flex items-center gap-1 text-emerald-300">
                          <CheckCircle2 className="h-4 w-4" />
                          Role-based
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                        <span className="text-slate-300">Audit logging</span>
                        <span className="inline-flex items-center gap-1 text-cyan-200">
                          <Activity className="h-4 w-4" />
                          Streaming
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Core controls</h3>
                      <Vote className="h-5 w-5 text-cyan-200" />
                    </div>
                    <div className="mt-5 grid gap-3">
                      {[
                        'Create and manage elections',
                        'Add or update candidates',
                        'Control start and end times',
                        'Export election reports',
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/35 px-4 py-3 text-sm text-slate-200">
                          <CircleCheckBig className="h-4 w-4 text-cyan-200" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {data.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 shadow-lg shadow-slate-950/10 backdrop-blur-xl">
                    <div className="flex items-center justify-between text-sm text-slate-400">
                      <span>{metric.label}</span>
                      <LayoutDashboard className="h-4 w-4 text-cyan-200/70" />
                    </div>
                    <div className="mt-3 text-3xl font-semibold text-white">{metric.value}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{metric.note}</p>
                  </div>
                ))}
              </section>

              {isAdmin && showCreateElection && (
                <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/10 backdrop-blur-xl">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Admin action</p>
                      <h3 className="mt-1 text-xl font-semibold text-white">Create election</h3>
                    </div>
                    <span className="text-sm text-slate-400">Define title, timing, and optional status.</span>
                  </div>

                  {createStatus.type === 'error' && createStatus.message && (
                    <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                      {createStatus.message}
                    </div>
                  )}
                  {createStatus.type === 'success' && createStatus.message && (
                    <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                      {createStatus.message}
                    </div>
                  )}

                  <form onSubmit={handleCreateElectionSubmit} className="mt-6 grid gap-4 lg:grid-cols-2">
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-slate-200 mb-2">Title</label>
                      <input
                        value={electionForm.title}
                        onChange={(e) => setElectionForm((prev) => ({ ...prev, title: e.target.value }))}
                        className="block w-full rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                        placeholder="e.g. Student Council President"
                        required
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-slate-200 mb-2">Description (optional)</label>
                      <textarea
                        value={electionForm.description}
                        onChange={(e) => setElectionForm((prev) => ({ ...prev, description: e.target.value }))}
                        className="block w-full rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                        rows={3}
                        placeholder="Short note shown on the dashboard"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">Start date & time</label>
                      <input
                        type="datetime-local"
                        value={electionForm.startDate}
                        onChange={(e) => setElectionForm((prev) => ({ ...prev, startDate: e.target.value }))}
                        className="block w-full rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">End date & time</label>
                      <input
                        type="datetime-local"
                        value={electionForm.endDate}
                        onChange={(e) => setElectionForm((prev) => ({ ...prev, endDate: e.target.value }))}
                        className="block w-full rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                        required
                      />
                    </div>

                    <label className="lg:col-span-2 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-200">
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        Mark election as active
                      </span>
                      <input
                        type="checkbox"
                        checked={electionForm.isActive}
                        onChange={(e) => setElectionForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                        className="h-4 w-4 accent-cyan-400"
                      />
                    </label>

                    <div className="lg:col-span-2 flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={createStatus.type === 'loading'}
                        className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {createStatus.type === 'loading' ? 'Creating...' : 'Create election'}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateElection(false)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </section>
              )}

              {(exportStatus.type === 'error' && exportStatus.message) || (createStatus.type === 'error' && createStatus.message && !showCreateElection) ? (
                <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-100 shadow-lg shadow-rose-950/10">
                  {exportStatus.type === 'error' ? exportStatus.message : createStatus.message}
                </div>
              ) : null}

              <section className="grid gap-6 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Election control</p>
                      <h3 className="mt-1 text-2xl font-semibold text-white">Current elections</h3>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                      {data.dataMode === 'database' ? 'Database data' : 'Demo data'}
                    </span>
                  </div>

                  <div className="grid gap-4">
                    {data.elections.map((election) => (
                      <article key={election.id} className="rounded-[2rem] border border-white/10 bg-slate-950/35 p-6 shadow-lg shadow-slate-950/10 backdrop-blur-xl">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <h4 className="text-xl font-semibold text-white">{election.title}</h4>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusStyles[election.status]}`}>
                                {election.status}
                              </span>
                            </div>
                            <p className="max-w-2xl text-sm leading-6 text-slate-300">{election.description}</p>
                            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                              <span className="inline-flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-cyan-200" />
                                Starts {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(election.startDate))}
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-cyan-200" />
                                Ends {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(election.endDate))}
                              </span>
                            </div>
                          </div>

                          <div className="min-w-[170px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                            <div className="flex items-center justify-between gap-4">
                              <span>{election.label}</span>
                              <span className="font-semibold text-white">{election.progress}%</span>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-white/10">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-300"
                                style={{ width: `${Math.min(100, Math.max(0, election.progress))}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="space-y-6 lg:col-span-4">
                  <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Security checklist</p>
                        <h3 className="mt-1 text-lg font-semibold text-white">Voter protection</h3>
                      </div>
                      <Fingerprint className="h-5 w-5 text-cyan-200" />
                    </div>

                    <div className="mt-5 space-y-3">
                      {data.securityChecks.map((check) => (
                        <div key={check.label} className="rounded-2xl border border-white/8 bg-slate-950/35 p-4">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sm font-medium text-white">{check.label}</span>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${check.tone === 'good' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                              {check.value}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Live activity</p>
                        <h3 className="mt-1 text-lg font-semibold text-white">Recent events</h3>
                      </div>
                      <BellRing className="h-5 w-5 text-cyan-200" />
                    </div>

                    <div className="mt-5 space-y-4">
                      {data.activity.map((item, index) => (
                        <div key={`${item.title}-${index}`} className="flex gap-3">
                          <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/15">
                            <Activity className="h-4 w-4" />
                          </div>
                          <div className="flex-1 rounded-2xl border border-white/8 bg-slate-950/35 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                              <span className="text-xs text-slate-400">{item.time}</span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-300">{item.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </section>

              <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                {featureCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <div key={card.title} className="rounded-[1.75rem] border border-white/10 bg-slate-950/35 p-5 backdrop-blur-xl">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-cyan-200 ring-1 ring-white/10">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="text-base font-semibold text-white">{card.title}</h3>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-slate-300">{card.detail}</p>
                    </div>
                  );
                })}
              </section>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;