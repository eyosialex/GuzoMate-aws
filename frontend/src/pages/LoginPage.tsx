import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Compass, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ShieldAlert, Clock } from 'lucide-react';
import { useAuth } from '../features/AuthContext';
import { AuthApiError } from '../services/authService';
import { springTactile, springGentle } from '../lib/motion';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuspended, setIsSuspended] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rate-limit countdown timer
  useEffect(() => {
    if (rateLimitSeconds <= 0) return;
    const interval = setInterval(() => {
      setRateLimitSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitSeconds]);

  const destination = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/app';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSuspended(false);

    const emailNorm = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailNorm || !emailRegex.test(emailNorm)) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (rateLimitSeconds > 0) {
      setError(`Too many login attempts. Please wait ${Math.ceil(rateLimitSeconds / 60)} minutes.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: emailNorm, password, rememberMe });
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      if (err instanceof AuthApiError) {
        if (err.code === 'FORBIDDEN' || err.message.toLowerCase().includes('suspended')) {
          setIsSuspended(true);
          setError('Your account has been suspended by moderation. Please contact support@guzomate.et to appeal.');
        } else if (err.code === 'RATE_LIMIT_EXCEEDED' || err.status === 429) {
          setRateLimitSeconds(15 * 60); // 15-minute countdown
          setError('Too many failed attempts. Security cooldown active for 15 minutes.');
        } else if (err.code === 'UNAUTHORIZED' || err.status === 401) {
          setError('Invalid email or password. Please verify your credentials.');
        } else {
          setError(err.message);
        }
      } else {
        setError(err instanceof Error ? err.message : 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 bg-[#f8faf8] relative overflow-hidden font-sans">
      {/* Highland contour lines background accents */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#183a2b_1px,transparent_1px)] [background-size:16px_16px]" />

      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={springGentle}
        className="w-full max-w-md bg-white rounded-2xl border border-[#e2e8e3] shadow-lg shadow-[#183a2b]/5 p-6 sm:p-8 relative z-10"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <motion.div
            whileHover={shouldReduceMotion ? undefined : { rotate: 45 }}
            transition={springTactile}
            className="h-12 w-12 rounded-xl bg-[#183a2b] text-white flex items-center justify-center shadow-md mb-3"
          >
            <Compass className="w-7 h-7" />
          </motion.div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Sign In to GuzoMate</h1>
            <span className="text-[10px] font-semibold bg-[#eef5f1] text-[#183a2b] border border-[#d1e2d8] px-2 py-0.5 rounded-full">
              Highland Portal
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-xs">
            Enter your credentials to access verified transit routing, hazard alerts, and travel reports.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`mb-4 p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
              isSuspended
                ? 'bg-amber-50 border border-amber-300 text-amber-900'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {isSuspended ? (
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span>{error}</span>
              {isSuspended && (
                <div className="mt-1">
                  <a href="mailto:support@guzomate.et" className="underline font-bold text-amber-950">
                    Contact GuzoMate Moderation Desk
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Rate limit warning banner */}
        {rateLimitSeconds > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Cooldown active: {Math.floor(rateLimitSeconds / 60)}:{(rateLimitSeconds % 60).toString().padStart(2, '0')} remaining.
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="login-email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="traveler@example.com"
                required
                disabled={rateLimitSeconds > 0}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#183a2b] focus:border-transparent transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700" htmlFor="login-pass">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-pass"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={rateLimitSeconds > 0}
                className="w-full pl-9 pr-10 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#183a2b] focus:border-transparent transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-[#183a2b] rounded border-gray-300 focus:ring-[#183a2b]"
              />
              <span className="text-xs text-gray-600">Remember this device</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || rateLimitSeconds > 0}
            className="w-full mt-2 py-2.5 px-4 bg-[#183a2b] hover:bg-[#133020] active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Compass className="w-4 h-4 animate-spin" /> Verifying...
              </span>
            ) : (
              <>
                Sign In to GuzoMate <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Link to Registration */}
        <div className="mt-6 text-center text-xs text-gray-500">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-[#183a2b] hover:underline">
            Register new account
          </Link>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <div className="mt-8 text-center text-[11px] text-gray-400">
        © 2024 GuzoMate Ethiopia — Verified Highland Travel Intelligence
      </div>
    </div>
  );
};
