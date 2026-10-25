import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Compass, Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowRight, Globe } from 'lucide-react';
import { useAuth } from '../features/AuthContext';
import { Language } from '../types';
import { springTactile, springGentle } from '../lib/motion';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<Language>('en');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        preferredLanguage,
      });
      navigate('/app', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 bg-[#f8faf8] relative overflow-hidden font-sans">
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
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Create Scout Account</h1>
            <span className="text-[10px] font-semibold bg-[#eef5f1] text-[#183a2b] border border-[#d1e2d8] px-2 py-0.5 rounded-full">
              Ethiopian Guild
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-xs">
            Join the verified highland travelers network to report road hazards and get priority advisories.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="name-input">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="name-input"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dawit Alemayehu"
                required
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#183a2b] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="reg-email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="scout@guzomate.et"
                required
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#183a2b] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="reg-lang">
              Preferred Language
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                id="reg-lang"
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value as Language)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#183a2b] focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="en">English (International)</option>
                <option value="am">አማርኛ (Amharic)</option>
                <option value="om">Afaan Oromoo (Oromo)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="reg-pass">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="reg-pass"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
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

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="reg-confirm">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="reg-confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                required
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#183a2b] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-3 py-2.5 px-4 bg-[#183a2b] hover:bg-[#133020] active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Compass className="w-4 h-4 animate-spin" /> Registering...
              </span>
            ) : (
              <>
                Create Account <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#183a2b] hover:underline">
            Sign In here
          </Link>
        </div>
      </motion.div>

      <div className="mt-8 text-center text-[11px] text-gray-400">
        © 2024 GuzoMate Ethiopia — Verified Highland Travel Intelligence
      </div>
    </div>
  );
};

export default RegisterPage;
