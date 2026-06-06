import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { AuthUser } from '../context/AuthContext';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setTokens } = useAuth();
  const email = (location.state as { email?: string })?.email ?? '';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length < 6) {
      setError('Enter all 6 digits');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{
        data: { accessToken: string; refreshToken: string; user: AuthUser };
      }>('/auth/verify-otp', { email, otp });
      const { accessToken, refreshToken, user } = res.data.data;
      setTokens(accessToken, refreshToken, user);
      toast.success('Email verified! Welcome aboard.');
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Invalid or expired OTP';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('New OTP sent to your email');
      setResendCountdown(60);
    } catch {
      toast.error('Failed to resend OTP');
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(180deg,_#04111f_0%,_#0a1524_100%)] p-4">
        <div className="text-slate-300 text-center">
          <p>No email found. Please <Link to="/register" className="text-cyan-300 underline">register again</Link>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.28),_transparent_30%),linear-gradient(180deg,_#04111f_0%,_#0a1524_100%)] p-4">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/7 p-8 shadow-[0_20px_80px_rgba(2,8,23,0.35)] backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/20 mx-auto mb-4">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Verify your email</h1>
          <p className="text-sm text-slate-300 mt-2">
            We sent a 6-digit code to <span className="text-cyan-300 font-medium">{email}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 flex items-start gap-3">
            <AlertCircle className="text-rose-300 w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-100">{error}</p>
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div
            className="flex gap-3 justify-center mb-6"
            onPaste={handlePaste}
            role="group"
            aria-label="One-time password input"
          >
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-bold border border-white/20 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                aria-label={`OTP digit ${i + 1}`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || digits.join('').length < 6}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>

        <div className="mt-6 text-center">
          {resendCountdown > 0 ? (
            <p className="text-sm text-slate-400">Resend in {resendCountdown}s</p>
          ) : (
            <button
              onClick={handleResend}
              className="inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Resend OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
