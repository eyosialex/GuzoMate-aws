import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../features/useAppStore';
import { authService, AuthApiError, isValidPhoneNumber, normalizePhoneNumber } from '../../services/authService';
import { GoogleAuthButton } from './GoogleAuthButton';
import logoImg from '../../assets/logo.png';
import { X, Lock, Phone, ShieldCheck, Eye, EyeOff, ArrowRight, AlertCircle, Smartphone } from 'lucide-react';
import confetti from 'canvas-confetti';

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup?: () => void;
  onUnverifiedPhone?: (phone: string) => void;
  onSuccess?: (session: any) => void;
  isEmbedded?: boolean;
}

interface LoginCopy {
  eyebrow: string;
  titleLead: string;
  titleEm: string;
  subtitle: string;
  phoneLabel: string;
  phonePlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  submitBtn: string;
  submitting: string;
  dividerText: string;
  noAccountPrompt: string;
  signupLink: string;
  footerNote: string;
  unverifiedAlert: string;
  verifyNowBtn: string;
  errors: {
    phoneRequired: string;
    phoneInvalid: string;
    passwordRequired: string;
    unauthorized: string;
    forbidden: string;
    rateLimit: string;
    generic: string;
  };
}

const loginCopy: Record<'en' | 'am' | 'om', LoginCopy> = {
  en: {
    eyebrow: '01 / GuzoMate Access',
    titleLead: 'Welcome ',
    titleEm: 'back.',
    subtitle: 'Sign in to access your saved places, custom routes, and live reports.',
    phoneLabel: 'Phone Number',
    phonePlaceholder: '0911 234 567 or +251 9...',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    submitBtn: 'Log in',
    submitting: 'Signing in...',
    dividerText: 'or continue with',
    noAccountPrompt: "Don't have an account?",
    signupLink: 'Sign up',
    footerNote: 'Verified travel intelligence · Addis Ababa, Ethiopia',
    unverifiedAlert: 'Your phone number is not verified yet. Please enter the verification code we sent you.',
    verifyNowBtn: 'Verify phone code now',
    errors: {
      phoneRequired: 'Please enter your phone number.',
      phoneInvalid: 'Please enter a valid phone number (e.g. 0911234567 or +251911234567).',
      passwordRequired: 'Please enter your password.',
      unauthorized: 'Invalid phone number or password.',
      forbidden: 'Your account has been suspended by moderation.',
      rateLimit: 'Too many attempts. Please try again in 15 minutes.',
      generic: 'Authentication failed. Please try again.',
    },
  },
  am: {
    eyebrow: '01 / የጉዞሜት መግቢያ',
    titleLead: 'እንኳን ',
    titleEm: 'ደህና መጡ።',
    subtitle: 'የተቀመጡ ቦታዎችዎን፣ የመንገድ እቅዶችን እና የቀጥታ ሪፖርቶችን ለማግኘት ይግቡ።',
    phoneLabel: 'ስልክ ቁጥር',
    phonePlaceholder: '0911 234 567 ወይም +251 9...',
    passwordLabel: 'የይለፍ ቃል',
    passwordPlaceholder: '••••••••',
    submitBtn: 'ይግቡ',
    submitting: 'በማገናኘት ላይ...',
    dividerText: 'ወይም በGoogle ይቀጥሉ',
    noAccountPrompt: 'መለያ የለዎትም?',
    signupLink: 'ይመዝገቡ',
    footerNote: 'የተረጋገጠ የጉዞ መረጃ · አዲስ አበባ፣ ኢትዮጵያ',
    unverifiedAlert: 'ስልክ ቁጥርዎ ገና አልተረጋገጠም። እባክዎ የተላከውን የማረጋገጫ ኮድ ያስገቡ።',
    verifyNowBtn: 'ስልክ ቁጥር አሁን አረጋግጥ',
    errors: {
      phoneRequired: 'እባክዎ ስልክ ቁጥርዎን ያስገቡ።',
      phoneInvalid: 'እባክዎ ትክክለኛ ስልክ ቁጥር ያስገቡ (ለምሳሌ፦ 0911234567)።',
      passwordRequired: 'እባክዎ የይለፍ ቃልዎን ያስገቡ።',
      unauthorized: 'የተሳሳተ ስልክ ቁጥር ወይም የይለፍ ቃል።',
      forbidden: 'መለያዎ ታግዷል።',
      rateLimit: 'ብዙ ሙከራዎች ተደርገዋል። እባክዎ ከ15 ደቂቃ በኋላ እንደገና ይሞክሩ።',
      generic: 'ማረጋገጥ አልተሳካም። እባክዎ እንደገና ይሞክሩ።',
    },
  },
  om: {
    eyebrow: '01 / Seensa GuzoMate',
    titleLead: 'Baga ',
    titleEm: 'nagaan dhuftan.',
    subtitle: 'Bakkeewwan olkaa’aman, karoora karaalee fi gabaasaalee argachuuf seenaa.',
    phoneLabel: 'Lakkoofsa Bilbilaa',
    phonePlaceholder: '0911 234 567 ykn +251 9...',
    passwordLabel: 'Jecha Darbii',
    passwordPlaceholder: '••••••••',
    submitBtn: 'Seenaa',
    submitting: 'Wal-qunnamaa jira...',
    dividerText: 'yookiin kanaan itti fufaa',
    noAccountPrompt: 'Akkaawuntii hin qabdanii?',
    signupLink: "Galmaa'aa",
    footerNote: 'Odeeffannoo imalaa mirkanaa’e · Finfinnee, Itoophiyaa',
    unverifiedAlert: 'Lakkoofsi bilbila keessan ammatti hin mirkanoofne. Maaloo koodii mirkaneessaa galchaa.',
    verifyNowBtn: 'Bilbila amma mirkaneessi',
    errors: {
      phoneRequired: 'Maaloo lakkoofsa bilbilaa keessan galchaa.',
      phoneInvalid: 'Maaloo lakkoofsa bilbilaa sirrii galchaa (fkf. 0911234567).',
      passwordRequired: 'Maaloo jecha darbii keessan galchaa.',
      unauthorized: 'Lakkoofsa bilbilaa ykn jecha darbii dogoggoraa.',
      forbidden: 'Akkaawuntiin keessan uggurameera.',
      rateLimit: 'Yaalii baay’ee taasiftaniittu. Maaloo daqiiqaa 15 booda yaalaa.',
      generic: 'Mirkaneeffachuun hin danda’amne. Maaloo irra deebi’aa yaalaa.',
    },
  },
};

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToSignup,
  onUnverifiedPhone,
  onSuccess,
  isEmbedded = false,
}) => {
  const { language, setCurrentUser, setPageView } = useAppStore();
  const t: LoginCopy = loginCopy[language as 'en' | 'am' | 'om'] || loginCopy.en;

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isUnverifiedAlert, setIsUnverifiedAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setIsUnverifiedAlert(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsUnverifiedAlert(false);

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setErrorMsg(t.errors.phoneRequired);
      return;
    }

    if (!isValidPhoneNumber(trimmedPhone)) {
      setErrorMsg(t.errors.phoneInvalid);
      return;
    }

    if (!password) {
      setErrorMsg(t.errors.passwordRequired);
      return;
    }

    setIsSubmitting(true);

    try {
      const normalized = normalizePhoneNumber(trimmedPhone);
      const session = await authService.login({
        phoneNumber: normalized,
        password,
      });

      setCurrentUser({
        id: session.user.id,
        name: session.user.fullName || session.user.name || session.user.phoneNumber || 'Traveler',
        email: session.user.email || '',
        phone: session.user.phoneNumber || normalized,
        preferredLanguage: session.user.preferredLanguage,
        isGuildVerified: session.user.role !== 'USER' || session.user.trustRating !== undefined,
      });

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#2555d9', '#173aa0', '#e68a3c', '#9fcfdf'],
      });

      if (onSuccess) {
        onSuccess(session);
      } else {
        onClose();
        setPageView('home');
      }
    } catch (err: unknown) {
      if (err instanceof AuthApiError) {
        if (err.code === 'PHONE_NOT_VERIFIED') {
          setIsUnverifiedAlert(true);
          setErrorMsg(t.unverifiedAlert);
        } else if (err.code === 'UNAUTHORIZED') {
          setErrorMsg(t.errors.unauthorized);
        } else if (err.code === 'FORBIDDEN') {
          setErrorMsg(t.errors.forbidden);
        } else if (err.code === 'RATE_LIMIT_EXCEEDED') {
          setErrorMsg(t.errors.rateLimit);
        } else {
          setErrorMsg(err.message || t.errors.generic);
        }
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(t.errors.generic);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyUnverified = () => {
    const norm = normalizePhoneNumber(phone.trim()) || phone.trim();
    if (onUnverifiedPhone) {
      onUnverifiedPhone(norm);
    }
  };

  const content = (
    <div
      role="region"
      aria-labelledby="login-modal-title"
      lang={language}
      className="relative w-full text-[#20221f]"
      style={{ fontFamily: "'DM Sans', 'Noto Sans Ethiopic', system-ui, -apple-system, sans-serif" }}
    >
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2.5 mb-2.5">
          <span className="w-9 h-9 rounded-xl bg-[#f1efe7] border border-[rgba(32,34,31,0.14)] p-1 flex items-center justify-center shadow-xs">
            <img src={logoImg} alt="GuzoMate" className="w-full h-full object-contain" />
          </span>
          <div>
            <span
              className="block font-mono text-[10px] tracking-widest uppercase text-[#6d7068]"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {t.eyebrow}
            </span>
            <span className="block font-bold text-xs tracking-tight text-[#20221f]">
              GuzoMate
            </span>
          </div>
        </div>

        <h2
          id="login-modal-title"
          className="text-2xl sm:text-[26px] leading-tight text-[#20221f] font-normal mb-1.5"
          style={{ fontFamily: "'Newsreader', 'Noto Sans Ethiopic', Georgia, serif" }}
        >
          {t.titleLead}
          <em
            className="italic text-[#2555d9] font-normal"
            style={{ fontFamily: "'Newsreader', 'Noto Sans Ethiopic', Georgia, serif" }}
          >
            {t.titleEm}
          </em>
        </h2>
        <p className="text-xs text-[#6d7068] leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className={`mb-3.5 p-3 rounded-xl border text-xs font-medium overflow-hidden ${
              isUnverifiedAlert
                ? 'bg-[#fff9e6] border-[#f2c94c] text-[#8a6100]'
                : 'bg-[#fbf2f0] border-[rgba(218,89,63,0.3)] text-[#c24128]'
            }`}
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{errorMsg}</p>
                {isUnverifiedAlert && onUnverifiedPhone && (
                  <button
                    type="button"
                    onClick={handleVerifyUnverified}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2555d9] text-white font-semibold text-[11px] shadow-xs hover:bg-[#173aa0] transition-colors cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{t.verifyNowBtn}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Phone Number Field */}
        <div>
          <label
            className="block text-[11px] font-semibold tracking-wide uppercase text-[#555b55] mb-1 font-mono"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            {t.phoneLabel}
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-[#839084] pointer-events-none flex items-center gap-1">
              <Phone className="w-4 h-4" />
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.phonePlaceholder}
              autoComplete="tel"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#f3f1ea] border border-[rgba(32,34,31,0.12)] focus:bg-white focus:border-[#2555d9] focus:ring-3 focus:ring-[#2555d9]/15 text-xs text-[#20221f] placeholder-[#9da098] outline-none transition-all duration-200"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label
            className="block text-[11px] font-semibold tracking-wide uppercase text-[#555b55] mb-1 font-mono"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            {t.passwordLabel}
          </label>
          <div className="relative flex items-center">
            <Lock className="w-4 h-4 text-[#839084] absolute left-3 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.passwordPlaceholder}
              autoComplete="current-password"
              className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#f3f1ea] border border-[rgba(32,34,31,0.12)] focus:bg-white focus:border-[#2555d9] focus:ring-3 focus:ring-[#2555d9]/15 text-xs text-[#20221f] placeholder-[#9da098] outline-none transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-[#839084] hover:text-[#20221f] transition-colors cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Action Button */}
        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ y: -1, boxShadow: '0 10px 24px -4px rgba(37, 85, 217, 0.45)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-[#2555d9] hover:bg-[#173aa0] active:bg-[#133085] text-white font-semibold text-xs tracking-wide shadow-[0_8px_20px_-4px_rgba(37,85,217,0.35)] flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t.submitting}</span>
            </>
          ) : (
            <>
              <span>{t.submitBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>

      {/* Divider */}
      <div className="relative my-4 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[rgba(32,34,31,0.08)]" />
        </div>
        <span
          className="relative bg-[#faf9f5] px-2.5 text-[10px] uppercase tracking-wider text-[#839084] font-mono"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {t.dividerText}
        </span>
      </div>

      {/* Google Sign-in */}
      <GoogleAuthButton />

      {/* Switch to Signup Link */}
      {onSwitchToSignup && (
        <div className="mt-3.5 text-center text-xs text-[#6d7068]">
          <span>{t.noAccountPrompt} </span>
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="font-semibold text-[#2555d9] hover:underline cursor-pointer"
          >
            {t.signupLink}
          </button>
        </div>
      )}

      {/* Footer Assurance */}
      <div className="mt-4 pt-3 border-t border-[rgba(32,34,31,0.08)] flex items-center justify-center gap-1.5 text-[11px] text-[#6d7068]">
        <ShieldCheck className="w-3.5 h-3.5 text-[#2555d9]" />
        <span>{t.footerNote}</span>
      </div>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#181a17]/60 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-[420px] bg-[#faf9f5] rounded-[24px] border border-[rgba(32,34,31,0.14)] p-6 sm:p-7 shadow-[0_24px_70px_rgba(50,55,48,0.22)] overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.7 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full border border-[rgba(32,34,31,0.12)] bg-[#f1efe7]/90 hover:bg-[#e7e4d8] text-[#555b55] hover:text-[#20221f] flex items-center justify-center transition-all cursor-pointer"
              aria-label="Close login modal"
            >
              <X className="w-4 h-4" />
            </button>

            {content}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
