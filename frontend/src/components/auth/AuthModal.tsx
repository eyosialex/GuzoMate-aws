import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../features/useAppStore';
import { 
  authService, 
  AuthApiError, 
  isValidPhoneNumber, 
  normalizePhoneNumber 
} from '../../services/authService';
import { OtpModal } from './OtpModal';
import { GoogleAuthButton } from './GoogleAuthButton';
import logoImg from '../../assets/logo.png';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle,
  Smartphone,
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';

export { LoginModal } from './LoginModal';
export { SignupModal } from './SignupModal';
export { OtpModal } from './OtpModal';
export { GoogleAuthButton } from './GoogleAuthButton';

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
  phoneLabel: string;
  phonePlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  confirmPasswordLabel: string;
  confirmPasswordPlaceholder: string;
  languageLabel: string;
  submitLogin: string;
  submitSignup: string;
  submitting: string;
  dividerText: string;
  footerNote: string;
  unverifiedNotice: string;
  verifyNowBtn: string;
  errors: {
    validEmail: string;
    validPhone: string;
    nameRequired: string;
    passwordRequired: string;
    passwordRule: string;
    passwordMismatch: string;
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
    emailLabel: 'Phone Number or Email address',
    emailPlaceholder: '0911 234 567 or you@example.com',
    phoneLabel: 'Phone Number',
    phonePlaceholder: '+251 9... or 09...',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    confirmPasswordLabel: 'Confirm Password',
    confirmPasswordPlaceholder: '••••••••',
    languageLabel: 'Preferred Language',
    submitLogin: 'Log in',
    submitSignup: 'Create Account',
    submitting: 'Connecting...',
    dividerText: 'or continue with',
    footerNote: 'Verified travel intelligence · Addis Ababa, Ethiopia',
    unverifiedNotice: 'Your phone number is not verified yet. Please enter your SMS verification code.',
    verifyNowBtn: 'Enter verification code now',
    errors: {
      validEmail: 'Please enter a valid phone number (e.g., 0911234567) or Please enter a valid email address.',
      validPhone: 'Please enter a valid phone number (e.g. 0911234567 or +251911234567).',
      nameRequired: 'Full name must be at least 2 characters long.',
      passwordRequired: 'Please enter your password.',
      passwordRule: 'Password must be at least 8 characters and contain at least one letter and one number.',
      passwordMismatch: 'Passwords do not match',
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
    emailLabel: 'ስልክ ቁጥር ወይም የኢሜይል አድራሻ',
    emailPlaceholder: '0911 234 567 ወይም you@example.com',
    phoneLabel: 'ስልክ ቁጥር',
    phonePlaceholder: '+251 9... ወይም 09...',
    passwordLabel: 'የይለፍ ቃል',
    passwordPlaceholder: '••••••••',
    confirmPasswordLabel: 'የይለፍ ቃል ያረጋግጡ',
    confirmPasswordPlaceholder: '••••••••',
    languageLabel: 'ተመራጭ ቋንቋ',
    submitLogin: 'ይግቡ',
    submitSignup: 'መለያ ፍጠር',
    submitting: 'በማገናኘት ላይ...',
    dividerText: 'ወይም በGoogle ይቀጥሉ',
    footerNote: 'የተረጋገጠ የጉዞ መረጃ · አዲስ አበባ፣ ኢትዮጵያ',
    unverifiedNotice: 'ስልክ ቁጥርዎ ገና አልተረጋገጠም። እባክዎ የማረጋገጫ ኮድ ያስገቡ።',
    verifyNowBtn: 'ኮዱን አሁን ያስገቡ',
    errors: {
      validEmail: 'እባክዎ ትክክለኛ የስልክ ቁጥር ያስገቡ ወይም እባክዎ ትክክለኛ የኢሜይል አድራሻ ያስገቡ።',
      validPhone: 'እባክዎ ትክክለኛ ስልክ ቁጥር ያስገቡ።',
      nameRequired: 'ሙሉ ስም ቢያንስ 2 ፊደላት መሆን አለበት።',
      passwordRequired: 'እባክዎ የይለፍ ቃልዎን ያስገቡ።',
      passwordRule: 'የይለፍ ቃል ቢያንስ 8 ፊደላት እና ቢያንስ አንድ ፊደል እና ቁጥር መያዝ አለበት።',
      passwordMismatch: 'የይለፍ ቃሎች አይመሳሰሉም።',
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
    emailLabel: 'Lakkoofsa Bilbilaa ykn Teessoo Imeelii',
    emailPlaceholder: '0911 234 567 ykn you@example.com',
    phoneLabel: 'Lakkoofsa Bilbilaa',
    phonePlaceholder: '+251 9... ykn 09...',
    passwordLabel: 'Jecha Darbii',
    passwordPlaceholder: '••••••••',
    confirmPasswordLabel: 'Jecha Darbii Mirkaneessi',
    confirmPasswordPlaceholder: '••••••••',
    languageLabel: 'Afaan Filatamaa',
    submitLogin: 'Seenaa',
    submitSignup: 'Akkaawuntii Uumaa',
    submitting: 'Wal-qunnamaa jira...',
    dividerText: 'yookiin kanaan itti fufaa',
    footerNote: 'Odeeffannoo imalaa mirkanaa’e · Finfinnee, Itoophiyaa',
    unverifiedNotice: 'Lakkoofsi bilbilaa keessan ammatti hin mirkanoofne. Maaloo koodii SMS galchaa.',
    verifyNowBtn: 'Koodii amma galchaa',
    errors: {
      validEmail: 'Maaloo lakkoofsa bilbilaa sirrii ykn Maaloo teessoo imeelii sirrii galchaa.',
      validPhone: 'Maaloo lakkoofsa bilbilaa sirrii galchaa.',
      nameRequired: 'Maqaan guutuun yoo xiqqaate qubee 2 ta’uu qaba.',
      passwordRequired: 'Maaloo jecha darbii keessan galchaa.',
      passwordRule: 'Jechi darbii yoo xiqqaate qubee 8 ta’uu fi qubee fi lakkoofsa of keessaa qabaachuu qaba.',
      passwordMismatch: 'Jechoonni darbii wal hin gitne.',
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
    otpPhoneNumber,
    closeAuthModal, 
    openAuthModal, 
    openOtpModal,
    setOtpPhoneNumber,
    setCurrentUser, 
    setPageView,
    language,
    setLanguage 
  } = useAppStore();

  const [identifier, setIdentifier] = useState(''); // phone or email
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [preferredLang, setPreferredLang] = useState<'en' | 'am' | 'om'>(language as any || 'en');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isUnverifiedAlert, setIsUnverifiedAlert] = useState(false);
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
    setIsUnverifiedAlert(false);
    setPreferredLang(language as any || 'en');
  }, [authModalTab, isAuthModalOpen, language]);

  // Handle direct transition to OTP modal when phone is unverified
  const handleGoToOtp = (targetPhone?: string) => {
    const raw = targetPhone || phone || identifier;
    const norm = normalizePhoneNumber(raw) || raw.trim();
    if (norm) {
      setOtpPhoneNumber(norm);
      openAuthModal('otp', norm);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsUnverifiedAlert(false);

    const inputVal = identifier.trim();
    const phoneVal = phone.trim();

    // Check if user entered phone or email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(inputVal);
    const isPhone = isValidPhoneNumber(inputVal) || isValidPhoneNumber(phoneVal);

    if (authModalTab === 'login') {
      if (!inputVal) {
        setErrorMsg(t.errors.validEmail);
        return;
      }
      if (!isEmail && !isPhone && !/^\d{8,14}$/.test(inputVal.replace(/\D/g, ''))) {
        setErrorMsg(t.errors.validEmail);
        return;
      }
      if (!password) {
        setErrorMsg(t.errors.passwordRequired);
        return;
      }
    } else if (authModalTab === 'signup') {
      const nameVal = name.trim();
      if (nameVal.length < 2) {
        setErrorMsg(t.errors.nameRequired);
        return;
      }

      // Check phone or identifier for signup
      const rawTarget = phoneVal || inputVal;
      if (!rawTarget) {
        setErrorMsg(t.errors.validEmail);
        return;
      }

      const isTargetPhone = isValidPhoneNumber(rawTarget) || /^\d{8,14}$/.test(rawTarget.replace(/\D/g, ''));
      const isTargetEmail = emailRegex.test(rawTarget);

      if (!isTargetPhone && !isTargetEmail) {
        setErrorMsg(t.errors.validEmail);
        return;
      }

      if (!password) {
        setErrorMsg(t.errors.passwordRequired);
        return;
      }

      const isPasswordValid = password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
      if (!isPasswordValid) {
        setErrorMsg(t.errors.passwordRule);
        return;
      }

      if (confirmPassword && password !== confirmPassword) {
        setErrorMsg(t.errors.passwordMismatch);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (authModalTab === 'signup') {
        const rawTargetPhone = phoneVal || inputVal;
        const normalized = normalizePhoneNumber(rawTargetPhone) || rawTargetPhone;

        const regResult = await authService.register({
          fullName: name.trim() || 'Traveler',
          phoneNumber: normalized,
          password,
          confirmPassword: confirmPassword || password,
          preferredLanguage: preferredLang,
          name: name.trim(),
          email: isEmail ? inputVal : undefined,
        });

        if (preferredLang !== language) {
          setLanguage(preferredLang as any);
        }

        // If mock returned accessToken immediately
        if (regResult.accessToken) {
          setCurrentUser({
            id: regResult.user.id,
            name: regResult.user.fullName || regResult.user.name || 'Traveler',
            email: regResult.user.email || '',
            phone: regResult.user.phoneNumber || normalized,
            preferredLanguage: regResult.user.preferredLanguage,
            isGuildVerified: regResult.user.role !== 'USER' || regResult.user.trustRating !== undefined,
          });

          closeAuthModal();
          setPageView('home');

          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#2555d9', '#173aa0', '#e68a3c', '#9fcfdf'],
          });
          return;
        }

        // Standard flow: unverified user registered, advance to OTP Verification
        setOtpPhoneNumber(normalized);
        openAuthModal('otp', normalized);
        return;
      }

      // Login tab
      const targetPhoneOrEmail = inputVal || phoneVal;
      const normalizedTarget = normalizePhoneNumber(targetPhoneOrEmail) || targetPhoneOrEmail;

      const session = await authService.login({
        phoneNumber: normalizedTarget,
        email: isEmail ? inputVal : undefined,
        password,
      });

      setCurrentUser({
        id: session.user.id,
        name: session.user.fullName || session.user.name || session.user.phoneNumber || inputVal.split('@')[0],
        email: session.user.email || '',
        phone: session.user.phoneNumber || normalizedTarget,
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
        if (err.code === 'PHONE_NOT_VERIFIED') {
          setIsUnverifiedAlert(true);
          setErrorMsg(t.unverifiedNotice);
        } else if (err.code === 'CONFLICT') {
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

            {/* Render OTP Step if Active */}
            {authModalTab === 'otp' ? (
              <OtpModal
                isOpen={true}
                isEmbedded={true}
                phoneNumber={otpPhoneNumber || phone || identifier}
                onClose={closeAuthModal}
                onChangePhone={() => openAuthModal('signup')}
                onSuccess={(session) => {
                  closeAuthModal();
                  setPageView('home');
                }}
              />
            ) : (
              <>
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
                          {isUnverifiedAlert && (
                            <button
                              type="button"
                              onClick={() => handleGoToOtp()}
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

                {/* Form Inputs */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Full Name Field (Signup only) */}
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

                  {/* Primary Identifier: Phone / Email Field */}
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
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder={t.emailPlaceholder}
                        autoComplete="username tel"
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

                  {/* Phone Field (Signup only, additional dedicated SMS field) */}
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
                          <p>{t.phoneLabel}</p>
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

                  {/* Confirm Password Field (Signup only) */}
                  <AnimatePresence initial={false}>
                    {authModalTab === 'signup' && (
                      <motion.div
                        key="confirm-password-field"
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
                          {t.confirmPasswordLabel}
                        </label>
                        <div className="relative flex items-center">
                          <Lock className="w-4 h-4 text-[#839084] absolute left-3 pointer-events-none" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t.confirmPasswordPlaceholder}
                            autoComplete="new-password"
                            className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#f3f1ea] border border-[rgba(32,34,31,0.12)] focus:bg-white focus:border-[#2555d9] focus:ring-3 focus:ring-[#2555d9]/15 text-xs text-[#20221f] placeholder-[#9da098] outline-none transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 text-[#839084] hover:text-[#20221f] transition-colors cursor-pointer"
                            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
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

                {/* Google Sign-in Divider & Button */}
                <div className="relative my-3 flex items-center justify-center">
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

                <GoogleAuthButton />

                {/* Travel Intelligence Assurance Footer */}
                <div className="mt-4 pt-3 border-t border-[rgba(32,34,31,0.08)] flex items-center justify-center gap-1.5 text-[11px] text-[#6d7068]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2555d9]" />
                  <span>{t.footerNote}</span>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
