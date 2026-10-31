import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../features/useAppStore';
import { authService, AuthApiError } from '../../services/authService';
import logoImg from '../../assets/logo.png';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  ShieldCheck, 
  Eye, 
  EyeOff
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthCopy {
  eyebrow: string;
  loginTitleLead: string;
  loginTitleEm: string;
  loginSubtitle: string;
  signupTitleLead: string;
  signupTitleEm: string;
  signupSubtitle: string;
  tabLogin: string;
  tabSignup: string;
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  phonePlaceholder: string;
  submitLogin: string;
  submitSignup: string;
  submitting: string;
  footerNote: string;
  errors: {
    validEmail: string;
    passwordRequired: string;
    passwordRule: string;
    conflict: string;
    unauthorized: string;
    forbidden: string;
    rateLimit: string;
    generic: string;
  };
}

const authCopy: Record<'en' | 'am' | 'om', AuthCopy> = {
  en: {
    eyebrow: '01 / GuzoMate Access',
    loginTitleLead: 'Welcome ',
    loginTitleEm: 'back.',
    loginSubtitle: 'Sign in to access your saved places, custom routes, and live reports.',
    signupTitleLead: 'Begin your ',
    signupTitleEm: 'journey.',
    signupSubtitle: 'Create a free account to bookmark locations and unlock AI guidance.',
    tabLogin: 'Log in',
    tabSignup: 'Sign up',
    nameLabel: 'Full Name',
    namePlaceholder: 'e.g. Abebe Bikila',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    phonePlaceholder: '+251 9... or +251 7...',
    submitLogin: 'Log in',
    submitSignup: 'Create Account',
    submitting: 'Connecting...',
    footerNote: 'Verified travel intelligence · Addis Ababa, Ethiopia',
    errors: {
      validEmail: 'Please enter a valid email address.',
      passwordRequired: 'Please enter your password.',
      passwordRule: 'Password must be at least 8 characters and contain at least one letter and one number.',
      conflict: 'An account with this email address already exists. Please sign in instead.',
      unauthorized: 'Invalid email or password.',
      forbidden: 'Your account has been suspended by moderation.',
      rateLimit: 'Too many attempts. Please try again in 15 minutes.',
      generic: 'Authentication failed. Please try again.',
    },
  },
  am: {
    eyebrow: '01 / የጉዞሜት መግቢያ',
    loginTitleLead: 'እንኳን ',
    loginTitleEm: 'ደህና መጡ።',
    loginSubtitle: 'የተቀመጡ ቦታዎችዎን፣ የመንገድ እቅዶችን እና የቀጥታ ሪፖርቶችን ለማግኘት ይግቡ።',
    signupTitleLead: 'ጉዞዎን ',
    signupTitleEm: 'ይጀምሩ።',
    signupSubtitle: 'ቦታዎችን ለማስቀመጥ እና የAI የጉዞ ረዳት ለማግኘት ነፃ መለያ ይፍጠሩ።',
    tabLogin: 'ይግቡ',
    tabSignup: 'ይመዝገቡ',
    nameLabel: 'ሙሉ ስም',
    namePlaceholder: 'ለምሳሌ፦ አበበ ቢቂላ',
    emailLabel: 'ኢሜይል አድራሻ',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'የይለፍ ቃል',
    passwordPlaceholder: '••••••••',
    phonePlaceholder: '+251 9... ወይም +251 7...',
    submitLogin: 'ይግቡ',
    submitSignup: 'መለያ ፍጠር',
    submitting: 'በማገናኘት ላይ...',
    footerNote: 'የተረጋገጠ የጉዞ መረጃ · አዲስ አበባ፣ ኢትዮጵያ',
    errors: {
      validEmail: 'እባክዎ ትክክለኛ የኢሜይል አድራሻ ያስገቡ።',
      passwordRequired: 'እባክዎ የይለፍ ቃልዎን ያስገቡ።',
      passwordRule: 'የይለፍ ቃል ቢያንስ 8 ፊደላት እና ቢያንስ አንድ ፊደል እና ቁጥር መያዝ አለበት።',
      conflict: 'በዚህ ኢሜይል የተመዘገበ መለያ አለ። እባክዎ ይግቡ።',
      unauthorized: 'የተሳሳተ ኢሜይል ወይም የይለፍ ቃል።',
      forbidden: 'መለያዎ ታግዷል።',
      rateLimit: 'ብዙ ሙከራዎች ተደርገዋል። እባክዎ ከ15 ደቂቃ በኋላ እንደገና ይሞክሩ።',
      generic: 'ማረጋገጥ አልተሳካም። እባክዎ እንደገና ይሞክሩ።',
    },
  },
  om: {
    eyebrow: '01 / Seensa GuzoMate',
    loginTitleLead: 'Baga ',
    loginTitleEm: 'nagaan dhuftan.',
    loginSubtitle: 'Bakkeewwan olkaa’aman, karoora karaalee fi gabaasaalee argachuuf seenaa.',
    signupTitleLead: 'Imala keessan ',
    signupTitleEm: 'eegalaa.',
    signupSubtitle: 'Bakkeewwan galmeeffachuufi gorsa AI argachuuf akkaawuntii tolaa banadhaa.',
    tabLogin: 'Seenaa',
    tabSignup: "Galmaa'aa",
    nameLabel: 'Maqaa Guutuu',
    namePlaceholder: 'fkf. Abbabaa Biqilaa',
    emailLabel: 'Teessoo Imeelii',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'Jecha Darbii',
    passwordPlaceholder: '••••••••',
    phonePlaceholder: '+251 9... yookiin +251 7...',
    submitLogin: 'Seenaa',
    submitSignup: 'Akkaawuntii Uumaa',
    submitting: 'Wal-qunnamaa jira...',
    footerNote: 'Odeeffannoo imalaa mirkanaa’e · Finfinnee, Itoophiyaa',
    errors: {
      validEmail: 'Maaloo teessoo imeelii sirrii galchaa.',
      passwordRequired: 'Maaloo jecha darbii keessan galchaa.',
      passwordRule: 'Jechi darbii yoo xiqqaate qubee 8 ta’uu fi qubee fi lakkoofsa of keessaa qabaachuu qaba.',
      conflict: 'Imeelii kanaan akkaawuntiin duraan banameera. Maaloo seenaa.',
      unauthorized: 'Imeelii ykn jecha darbii dogoggoraa.',
      forbidden: 'Akkaawuntiin keessan uggurameera.',
      rateLimit: 'Yaalii baay’ee taasiftaniittu. Maaloo daqiiqaa 15 booda yaalaa.',
      generic: 'Mirkaneeffachuun hin danda’amne. Maaloo irra deebi’aa yaalaa.',
    },
  },
};

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    authModalTab, 
    closeAuthModal, 
    openAuthModal, 
    setCurrentUser, 
    setPageView,
    language 
  } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t: AuthCopy = authCopy[language as 'en' | 'am' | 'om'] || authCopy.en;

  // Escape key handler to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  // Reset transient error when tab or open state changes
  useEffect(() => {
    setErrorMsg('');
  }, [authModalTab, isAuthModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const emailNorm = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailNorm || !emailRegex.test(emailNorm)) {
      setErrorMsg(t.errors.validEmail);
      return;
    }

    if (!password) {
      setErrorMsg(t.errors.passwordRequired);
      return;
    }

    if (authModalTab === 'signup') {
      const isPasswordValid = password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
      if (!isPasswordValid) {
        setErrorMsg(t.errors.passwordRule);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let session;
      if (authModalTab === 'signup') {
        session = await authService.register({
          name: name.trim() || undefined,
          email: emailNorm,
          password,
          preferredLanguage: language as any,
        });
      } else {
        session = await authService.login({
          email: emailNorm,
          password,
        });
      }

      setCurrentUser({
        id: session.user.id,
        name: session.user.name || session.user.fullName || emailNorm.split('@')[0],
        email: session.user.email,
        phone: session.user.phone || phone.trim() || '',
        preferredLanguage: session.user.preferredLanguage,
        isGuildVerified: session.user.role !== 'USER' || session.user.trustRating !== undefined,
      });

      closeAuthModal();
      setPageView('home');

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#2555d9', '#173aa0', '#e68a3c', '#9fcfdf'],
      });
    } catch (err: unknown) {
      if (err instanceof AuthApiError) {
        if (err.code === 'CONFLICT') {
          setErrorMsg(t.errors.conflict);
        } else if (err.code === 'UNAUTHORIZED') {
          setErrorMsg(t.errors.unauthorized);
        } else if (err.code === 'FORBIDDEN') {
          setErrorMsg(t.errors.forbidden);
        } else if (err.code === 'RATE_LIMIT_EXCEEDED') {
          setErrorMsg(t.errors.rateLimit);
        } else {
          setErrorMsg(err.message || t.errors.generic);
        }
      } else {
        setErrorMsg(err instanceof Error ? err.message : t.errors.generic);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#181a17]/60 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeAuthModal}
        >
          {/* Modal Card - Styled in unison with the tactile ivory paper of the landing page */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            lang={language}
            className="relative w-full max-w-[420px] bg-[#faf9f5] text-[#20221f] rounded-[24px] border border-[rgba(32,34,31,0.14)] p-6 sm:p-7 shadow-[0_24px_70px_rgba(50,55,48,0.22),0_8px_24px_rgba(50,55,48,0.10)] overflow-hidden"
            style={{ fontFamily: "'DM Sans', 'Noto Sans Ethiopic', system-ui, -apple-system, sans-serif" }}
            initial={{ opacity: 0, scale: 0.95, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.7 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative Subtle Paper Contour Lines (Landing Map Motif) */}
            <svg
              className="absolute -top-10 -right-10 w-44 h-44 opacity-[0.05] pointer-events-none"
              viewBox="0 0 200 200"
              aria-hidden="true"
            >
              <circle cx="100" cy="100" r="90" fill="none" stroke="#20221f" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="100" cy="100" r="60" fill="none" stroke="#20221f" strokeWidth="1" />
              <circle cx="100" cy="100" r="30" fill="none" stroke="#20221f" strokeWidth="1" />
              <path d="M100 0 L100 200 M0 100 L200 100" stroke="#20221f" strokeWidth="1" />
            </svg>

            {/* Circular Close Button */}
            <button
              type="button"
              onClick={closeAuthModal}
              className="absolute top-5 right-5 w-8 h-8 rounded-full border border-[rgba(32,34,31,0.12)] bg-[#f1efe7]/90 hover:bg-[#e7e4d8] text-[#555b55] hover:text-[#20221f] flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#2555d9]/30 cursor-pointer"
              aria-label="Close authentication modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
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
                id="auth-modal-title"
                className="text-2xl sm:text-[26px] leading-tight text-[#20221f] font-normal mb-1.5"
                style={{ fontFamily: "'Newsreader', 'Noto Sans Ethiopic', Georgia, serif" }}
              >
                {authModalTab === 'login' ? (
                  <>
                    {t.loginTitleLead}
                    <em 
                      className="italic text-[#2555d9] font-normal"
                      style={{ fontFamily: "'Newsreader', 'Noto Sans Ethiopic', Georgia, serif" }}
                    >
                      {t.loginTitleEm}
                    </em>
                  </>
                ) : (
                  <>
                    {t.signupTitleLead}
                    <em 
                      className="italic text-[#2555d9] font-normal"
                      style={{ fontFamily: "'Newsreader', 'Noto Sans Ethiopic', Georgia, serif" }}
                    >
                      {t.signupTitleEm}
                    </em>
                  </>
                )}
              </h2>
              <p className="text-xs text-[#6d7068] leading-relaxed">
                {authModalTab === 'login' ? t.loginSubtitle : t.signupSubtitle}
              </p>
            </div>

            {/* Segmented Animated Tab Switcher */}
            <div className="relative flex items-center p-1 bg-[#edeae1] rounded-xl border border-[rgba(32,34,31,0.08)] mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  openAuthModal('login');
                  setErrorMsg('');
                }}
                className={`relative z-10 flex-1 py-1.5 px-3 rounded-lg text-center transition-colors cursor-pointer ${
                  authModalTab === 'login'
                    ? 'text-[#20221f] font-bold'
                    : 'text-[#6d7068] hover:text-[#20221f]'
                }`}
              >
                {authModalTab === 'login' && (
                  <motion.span
                    layoutId="authModalTabIndicator"
                    className="absolute inset-0 bg-[#faf9f5] rounded-lg shadow-xs border border-[rgba(32,34,31,0.06)]"
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{t.tabLogin}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  openAuthModal('signup');
                  setErrorMsg('');
                }}
                className={`relative z-10 flex-1 py-1.5 px-3 rounded-lg text-center transition-colors cursor-pointer ${
                  authModalTab === 'signup'
                    ? 'text-[#20221f] font-bold'
                    : 'text-[#6d7068] hover:text-[#20221f]'
                }`}
              >
                {authModalTab === 'signup' && (
                  <motion.span
                    layoutId="authModalTabIndicator"
                    className="absolute inset-0 bg-[#faf9f5] rounded-lg shadow-xs border border-[rgba(32,34,31,0.06)]"
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{t.tabSignup}</span>
              </button>
            </div>

            {/* Error Message Alert */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -4, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -4, height: 0 }}
                  className="mb-3.5 p-2.5 rounded-xl bg-[#fbf2f0] border border-[rgba(218,89,63,0.3)] text-xs font-medium text-[#c24128] overflow-hidden"
                >
                  {errorMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Inputs with Smooth Static-Yet-Animated Flow */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Full Name Field (Signup only, smoothly animates into place without layout jitter) */}
              <AnimatePresence initial={false}>
                {authModalTab === 'signup' && (
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <label 
                      className="block text-[11px] font-semibold tracking-wide uppercase text-[#555b55] mb-1 font-mono"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {t.nameLabel}
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-[#839084] absolute left-3 pointer-events-none" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t.namePlaceholder}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#f3f1ea] border border-[rgba(32,34,31,0.12)] focus:bg-white focus:border-[#2555d9] focus:ring-3 focus:ring-[#2555d9]/15 text-xs text-[#20221f] placeholder-[#9da098] outline-none transition-all duration-200"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email / Username Field (Statically anchored) */}
              <div>
                <label 
                  className="block text-[11px] font-semibold tracking-wide uppercase text-[#555b55] mb-1 font-mono"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {t.emailLabel}
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-[#839084] absolute left-3 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    autoComplete="email"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#f3f1ea] border border-[rgba(32,34,31,0.12)] focus:bg-white focus:border-[#2555d9] focus:ring-3 focus:ring-[#2555d9]/15 text-xs text-[#20221f] placeholder-[#9da098] outline-none transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password Field (Statically anchored) */}
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
                    autoComplete={authModalTab === 'signup' ? 'new-password' : 'current-password'}
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

              {/* Phone Field (Signup only, optional for SMS hazard alerts) */}
              <AnimatePresence initial={false}>
                {authModalTab === 'signup' && (
                  <motion.div
                    key="phone-field"
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <label 
                      className="block text-[11px] font-semibold tracking-wide uppercase text-[#555b55] mb-1 font-mono"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {<p>Phone Number</p>}
                    </label>
                    <div className="relative flex items-center">
                      <Phone className="w-4 h-4 text-[#839084] absolute left-3 pointer-events-none" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t.phonePlaceholder}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#f3f1ea] border border-[rgba(32,34,31,0.12)] focus:bg-white focus:border-[#2555d9] focus:ring-3 focus:ring-[#2555d9]/15 text-xs text-[#20221f] placeholder-[#9da098] outline-none transition-all duration-200"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                    <span>{authModalTab === 'login' ? t.submitLogin : t.submitSignup}</span>
                    <svg
                      aria-hidden="true"
                      width={15}
                      height={15}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M14 7l5 5-5 5" />
                    </svg>
                  </>
                )}
              </motion.button>
            </form>

            {/* Travel Intelligence Assurance Footer */}
            <div className="mt-4 pt-3 border-t border-[rgba(32,34,31,0.08)] flex items-center justify-center gap-1.5 text-[11px] text-[#6d7068]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2555d9]" />
              <span>{t.footerNote}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
