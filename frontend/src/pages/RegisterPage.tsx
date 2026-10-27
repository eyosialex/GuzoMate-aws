import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Compass, Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowRight, Globe, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../features/AuthContext';
import { SupportedLanguage } from '../types/auth';
import { AuthApiError } from '../services/authService';
import { springTactile, springGentle } from '../lib/motion';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  // Determine initial language from browser locale
  const detectInitialLanguage = (): SupportedLanguage => {
    if (typeof navigator !== 'undefined') {
      const lang = navigator.language?.toLowerCase() || '';
      if (lang.startsWith('am')) return 'am';
      if (lang.startsWith('om')) return 'om';
    }
    return 'en';
  };

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<SupportedLanguage>(detectInitialLanguage());
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time password criteria
  const hasMinLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasLetter && hasDigit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const emailNorm = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailNorm || !emailRegex.test(emailNorm)) {
      setError('Please enter a valid email address (e.g. traveler@example.com).');
      return;
    }

    if (!isPasswordValid) {
      setError('Password must be at least 8 characters and include at least one letter and one number.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and re-type.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: fullName.trim() || undefined,
        fullName: fullName.trim() || undefined,
        email: emailNorm,
        password,
        preferredLanguage,
      });
      navigate('/app', { replace: true });
    } catch (err: unknown) {
      if (err instanceof AuthApiError) {
        if (err.code === 'CONFLICT') {
          setError('An account with this email address already exists. Please sign in instead.');
        } else if (err.code === 'VALIDATION_ERROR' && err.details && err.details.length > 0) {
          const map: Record<string, string> = {};
          err.details.forEach((d) => {
            const field = String(d.path[0] || 'general');
            map[field] = d.message;
          });
          setFieldErrors(map);
          setError(err.message || 'Please correct the highlighted errors.');
        } else if (err.code === 'RATE_LIMIT_EXCEEDED') {
          setError('Too many registration attempts from your network. Please wait 15 minutes before trying again.');
        } else {
          setError(err.message);
        }
      } else {
        setError(err instanceof Error ? err.message : 'Registration failed. Please check your network connection.');
      }
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
              Verified Traveler
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-xs">
            Join the verified highland travelers network to report road hazards and receive real-time alerts.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span>{error}</span>
              {error.includes('already exists') && (
                <div className="mt-1">
                  <Link to="/login" className="underline font-bold text-red-800 hover:text-red-950">
                    Go to Sign In →
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="name-input">
              Full Name (Optional)
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="name-input"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Abebe Bikila"
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#183a2b] focus:border-transparent transition-all"
              />
            </div>
            {fieldErrors.name && (
              <p className="text-[11px] text-red-600 mt-1">{fieldErrors.name}</p>
            )}
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
                placeholder="traveler@example.com"
                required
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#183a2b] focus:border-transparent transition-all"
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] text-red-600 mt-1">{fieldErrors.email}</p>
            )}
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
                onChange={(e) => setPreferredLanguage(e.target.value as SupportedLanguage)}
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
                placeholder="Min 8 characters (1 letter & 1 digit)"
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

            {/* Inline Password Strength Helper */}
            {password.length > 0 && (
              <div className="mt-2 p-2 bg-gray-50 border border-gray-200/80 rounded-lg text-[11px] space-y-1">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700' : 'text-gray-500'}`}>
                  <Check className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-600' : 'opacity-30'}`} />
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLetter ? 'text-emerald-700' : 'text-gray-500'}`}>
                  <Check className={`w-3.5 h-3.5 ${hasLetter ? 'text-emerald-600' : 'opacity-30'}`} />
                  <span>At least one letter (a-z, A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasDigit ? 'text-emerald-700' : 'text-gray-500'}`}>
                  <Check className={`w-3.5 h-3.5 ${hasDigit ? 'text-emerald-600' : 'opacity-30'}`} />
                  <span>At least one number (0-9)</span>
                </div>
              </div>
            )}
            {fieldErrors.password && (
              <p className="text-[11px] text-red-600 mt-1">{fieldErrors.password}</p>
            )}
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
