import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Compass, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../features/AuthContext';
import { springTactile, springGentle } from '../lib/motion';

export const LoginPage: React.FC = () => {
  const { login, quickDemoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const destination = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/app';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password, rememberMe });
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = async (index: number) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await quickDemoLogin(index);
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
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
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">GuzoMate</h1>
            <span className="text-[10px] font-semibold bg-[#eef5f1] text-[#183a2b] border border-[#d1e2d8] px-2 py-0.5 rounded-full">
              Highland Portal
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-xs">
            Sign in to access real-time road radar, verified corridor maps, and emergency guidance.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium"
          >
            {error}
          </motion.div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="email-input">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dawit@guzomate.et"
                required
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#183a2b] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700" htmlFor="password-input">
                Password
              </label>
              <button
                type="button"
                onClick={() => setError('For demo and local mode, use password: Password123')}
                className="text-[11px] font-medium text-[#183a2b] hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-9 pr-10 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#183a2b] focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1"
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
            disabled={isSubmitting}
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

        {/* 1-Click Quick Demo Sign-ins for instant testing */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 text-center mb-3">
            Quick Development Sign-In
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo(0)}
              disabled={isSubmitting}
              className="p-2.5 bg-[#f0f7f3] hover:bg-[#e2efe7] border border-[#d1e2d8] rounded-xl text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#183a2b]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#183a2b]" /> Dawit A.
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5 truncate">Verified Scout Guild #418</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo(1)}
              disabled={isSubmitting}
              className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Eden B.
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5 truncate">Addis Commuter</p>
            </button>
          </div>
        </div>

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

export default LoginPage;
