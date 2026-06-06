import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Invalid credentials. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.28),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.20),_transparent_25%),linear-gradient(180deg,_#04111f_0%,_#081827_48%,_#0a1524_100%)] p-4">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/7 p-8 shadow-[0_20px_80px_rgba(2,8,23,0.35)] backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/20 mx-auto mb-4">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Welcome Back</h1>
          <p className="text-sm text-slate-300 mt-2">Sign in to the Secure E-Voting Platform</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 flex items-start gap-3">
            <AlertCircle className="text-rose-300 w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-100">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                placeholder="you@example.com"
                required
                aria-label="Email address"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                placeholder="••••••••"
                required
                aria-label="Password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Signing in...' : <><LogIn className="w-5 h-5" />Sign In</>}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-300">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-cyan-300 hover:text-cyan-200 transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
