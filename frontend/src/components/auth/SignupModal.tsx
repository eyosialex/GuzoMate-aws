import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../features/useAppStore';
import { authService, AuthApiError, isValidPhoneNumber, normalizePhoneNumber } from '../../services/authService';
import { GoogleAuthButton } from './GoogleAuthButton';
import logoImg from '../../assets/logo.png';
import { 
  X, 
  User, 
  Lock, 
  Phone, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  Check, 
  Globe 
} from 'lucide-react';

export interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
  onRegistrationSuccess?: (phone: string) => void;
  onSuccess?: (session: any) => void;
  isEmbedded?: boolean;
}

interface SignupCopy {
  eyebrow: string;
  titleLead: string;
  titleEm: string;
  subtitle: string;
  nameLabel: string;
  namePlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  phoneHelp: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  confirmPasswordLabel: string;
  confirmPasswordPlaceholder: string;
  languageLabel: string;
  submitBtn: string;
  submitting: string;
  dividerText: string;
  hasAccountPrompt: string;
  loginLink: string;
  footerNote: string;
  strengthLabels: {
    weak: string;
    fair: string;
    strong: string;
  };
  errors: {
    nameShort: string;
    phoneRequired: string;
    phoneInvalid: string;
    passwordRule: string;
    passwordMismatch: string;
    conflict: string;
    generic: string;
  };
}

const signupCopy: Record<'en' | 'am' | 'om', SignupCopy> = {
  en: {
    eyebrow: '01 / GuzoMate Registration',
    titleLead: 'Begin your ',
    titleEm: 'journey.',
    subtitle: 'Create a free traveler account with phone verification & live alerts.',
    nameLabel: 'Full Name',
    namePlaceholder: 'e.g. Abebe Bikila',
    phoneLabel: 'Phone Number',
    phonePlaceholder: '0911 234 567 or +251 9...',
    phoneHelp: 'Used for SMS verification and trip alerts',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    confirmPasswordLabel: 'Confirm Password',
    confirmPasswordPlaceholder: '••••••••',
    languageLabel: 'Preferred Language',
    submitBtn: 'Create Account & Send Code',
    submitting: 'Creating account...',
    dividerText: 'or continue with',
    hasAccountPrompt: 'Already have an account?',
    loginLink: 'Log in',
    footerNote: 'Verified travel intelligence · Addis Ababa, Ethiopia',
    strengthLabels: {
      weak: 'Weak',
      fair: 'Fair',
      strong: 'Strong',
    },
    errors: {
      nameShort: 'Full name must be at least 2 characters long.',
      phoneRequired: 'Please enter your phone number.',
      phoneInvalid: 'Please enter a valid phone number (e.g. 0911234567 or +251911234567).',
      passwordRule: 'Password must be at least 8 characters with at least one letter and one number.',
      passwordMismatch: 'Passwords do not match.',
      conflict: 'A user with this phone number is already registered and verified. Please log in.',
      generic: 'Registration failed. Please verify your details.',
    },
  },
  am: {
    eyebrow: '01 / የጉዞሜት ምዝገባ',
    titleLead: 'ጉዞዎን ',
    titleEm: 'ይጀምሩ።',
    subtitle: 'ቦታዎችን ለማስቀመጥ እና የቀጥታ የጉዞ መረጃዎችን ለማግኘት ነፃ መለያ ይፍጠሩ።',
    nameLabel: 'ሙሉ ስም',
    namePlaceholder: 'ለምሳሌ፦ አበበ ቢቂላ',
    phoneLabel: 'ስልክ ቁጥር',
    phonePlaceholder: '0911 234 567 ወይም +251 9...',
    phoneHelp: 'ለማረጋገጫ ኮድ እና ማንቂያዎች ያገለግላል',
    passwordLabel: 'የይለፍ ቃል',
    passwordPlaceholder: '••••••••',
    confirmPasswordLabel: 'የይለፍ ቃል ያረጋግጡ',
    confirmPasswordPlaceholder: '••••••••',
    languageLabel: 'ተመራጭ ቋንቋ',
    submitBtn: 'መለያ ፍጠር እና ኮድ ላክ',
    submitting: 'በመመዝገብ ላይ...',
    dividerText: 'ወይም በGoogle ይቀጥሉ',
    hasAccountPrompt: 'መለያ አለዎት?',
    loginLink: 'ይግቡ',
    footerNote: 'የተረጋገጠ የጉዞ መረጃ · አዲስ አበባ፣ ኢትዮጵያ',
    strengthLabels: {
      weak: 'ደካማ',
      fair: 'መካከለኛ',
      strong: 'ጠንካራ',
    },
    errors: {
      nameShort: 'ሙሉ ስም ቢያንስ 2 ፊደላት መሆን አለበት።',
      phoneRequired: 'እባክዎ ስልክ ቁጥርዎን ያስገቡ።',
      phoneInvalid: 'እባክዎ ትክክለኛ ስልክ ቁጥር ያስገቡ (ለምሳሌ፦ 0911234567)።',
      passwordRule: 'የይለፍ ቃል ቢያንስ 8 ፊደላት፣ ቢያንስ አንድ ፊደል እና ቁጥር መያዝ አለበት።',
      passwordMismatch: 'የይለፍ ቃሎች አይመሳሰሉም።',
      conflict: 'በዚህ ስልክ የተመዘገበ መለያ አለ። እባክዎ ይግቡ።',
      generic: 'ምዝገባ አልተሳካም። እባክዎ መረጃዎን ያረጋግጡ።',
    },
  },
  om: {
    eyebrow: '01 / Galmee GuzoMate',
    titleLead: 'Imala keessan ',
    titleEm: 'eegalaa.',
    subtitle: 'Bakkeewwan olkaa’achuufi gorsa imalaa argachuuf akkaawuntii tolaa banadhaa.',
    nameLabel: 'Maqaa Guutuu',
    namePlaceholder: 'fkf. Abbabaa Biqilaa',
    phoneLabel: 'Lakkoofsa Bilbilaa',
    phonePlaceholder: '0911 234 567 ykn +251 9...',
    phoneHelp: 'Mirkaneessa koodii fi akeekkachiisaaf kan oolu',
    passwordLabel: 'Jecha Darbii',
    passwordPlaceholder: '••••••••',
    confirmPasswordLabel: 'Jecha Darbii Mirkaneessi',
    confirmPasswordPlaceholder: '••••••••',
    languageLabel: 'Afaan Filatamaa',
    submitBtn: 'Akkaawuntii Uumi & Koodii Ergi',
    submitting: 'Galmeessaa jira...',
    dividerText: 'yookiin kanaan itti fufaa',
    hasAccountPrompt: 'Akkaawuntii qabduu?',
    loginLink: 'Seenaa',
    footerNote: 'Odeeffannoo imalaa mirkanaa’e · Finfinnee, Itoophiyaa',
    strengthLabels: {
      weak: 'Laafaa',
      fair: 'Giddu-galeessa',
      strong: 'Cimaa',
    },
    errors: {
      nameShort: 'Maqaan guutuun yoo xiqqaate qubee 2 ta’uu qaba.',
      phoneRequired: 'Maaloo lakkoofsa bilbilaa keessan galchaa.',
      phoneInvalid: 'Maaloo lakkoofsa bilbilaa sirrii galchaa (fkf. 0911234567).',
      passwordRule: 'Jechi darbii yoo xiqqaate qubee 8, qubee fi lakkoofsa qabaachuu qaba.',
      passwordMismatch: 'Jechoonni darbii wal hin gitne.',
      conflict: 'Lakkoofsa kanaan akkaawuntiin duraan banameera. Maaloo seenaa.',
      generic: 'Galmeen hin milkoofne. Maaloo irra deebisaa yaalaa.',
    },
  },
};

export const SignupModal: React.FC<SignupModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
  onRegistrationSuccess,
  onSuccess,
  isEmbedded = false,
}) => {
  const { language, setLanguage } = useAppStore();
  const t: SignupCopy = signupCopy[language as 'en' | 'am' | 'om'] || signupCopy.en;

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedLang, setSelectedLang] = useState<'en' | 'am' | 'om'>(language as any || 'en');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSelectedLang(language as any || 'en');
    }
  }, [isOpen, language]);

  // Real-time password strength calculation
  const hasMinLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const strengthScore = [hasMinLength, hasLetter, hasNumber].filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedName = fullName.trim();
    if (trimmedName.length < 2) {
      setErrorMsg(t.errors.nameShort);
      return;
    }

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setErrorMsg(t.errors.phoneRequired);
      return;
    }

    if (!isValidPhoneNumber(trimmedPhone)) {
      setErrorMsg(t.errors.phoneInvalid);
      return;
    }

    if (!hasMinLength || !hasLetter || !hasNumber) {
      setErrorMsg(t.errors.passwordRule);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(t.errors.passwordMismatch);
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedPhone = normalizePhoneNumber(trimmedPhone);
      const res = await authService.register({
        fullName: trimmedName,
        phoneNumber: normalizedPhone,
        password,
        confirmPassword,
        preferredLanguage: selectedLang,
      });

      // Update active language preference if user changed it
      if (selectedLang !== language) {
        setLanguage(selectedLang as any);
      }

      // If backend mock returned token immediately
      if (res.accessToken && onSuccess) {
        onSuccess(res);
        return;
      }

      // Standard flow: User is created unverified, transition to OTP Verification
      if (onRegistrationSuccess) {
        onRegistrationSuccess(normalizedPhone);
      }
    } catch (err: unknown) {
      if (err instanceof AuthApiError) {
        if (err.code === 'CONFLICT') {
          setErrorMsg(t.errors.conflict);
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

  const content = (
    <div
      role="region"
      aria-labelledby="signup-modal-title"
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
          id="signup-modal-title"
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
            className="mb-3 p-2.5 rounded-xl bg-[#fbf2f0] border border-[rgba(218,89,63,0.3)] text-xs font-medium text-[#c24128] flex items-center gap-2 overflow-hidden"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-[#c24128]" />
            <div className="flex-1">{errorMsg}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Full Name Field */}
        <div>
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
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t.namePlaceholder}
              autoComplete="name"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#f3f1ea] border border-[rgba(32,34,31,0.12)] focus:bg-white focus:border-[#2555d9] focus:ring-3 focus:ring-[#2555d9]/15 text-xs text-[#20221f] placeholder-[#9da098] outline-none transition-all duration-200"
            />
          </div>
        </div>

        {/* Phone Number Field */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              className="block text-[11px] font-semibold tracking-wide uppercase text-[#555b55] font-mono"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {t.phoneLabel}
            </label>
            <span className="text-[10px] text-[#839084]">{t.phoneHelp}</span>
          </div>
          <div className="relative flex items-center">
            <Phone className="w-4 h-4 text-[#839084] absolute left-3 pointer-events-none" />
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
              autoComplete="new-password"
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

          {/* Password strength mini-meter */}
          {password.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <div className="flex-1 grid grid-cols-3 gap-1">
                <div className={`h-1 rounded-full ${strengthScore >= 1 ? 'bg-[#c24128]' : 'bg-[#e2ded5]'}`} />
                <div className={`h-1 rounded-full ${strengthScore >= 2 ? 'bg-[#e68a3c]' : 'bg-[#e2ded5]'}`} />
                <div className={`h-1 rounded-full ${strengthScore >= 3 ? 'bg-[#1c6e2b]' : 'bg-[#e2ded5]'}`} />
              </div>
              <span className="text-[10px] font-mono text-[#6d7068]">
                {strengthScore === 3 ? t.strengthLabels.strong : strengthScore === 2 ? t.strengthLabels.fair : t.strengthLabels.weak}
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
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
        </div>

        {/* Language Selection Pills */}
        <div>
          <label
            className="block text-[11px] font-semibold tracking-wide uppercase text-[#555b55] mb-1.5 font-mono flex items-center gap-1"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <Globe className="w-3.5 h-3.5 text-[#2555d9]" />
            {t.languageLabel}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['en', 'am', 'om'] as const).map((langCode) => (
              <button
                key={langCode}
                type="button"
                onClick={() => setSelectedLang(langCode)}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                  selectedLang === langCode
                    ? 'bg-[#2555d9] text-white border-[#2555d9] shadow-xs'
                    : 'bg-[#f3f1ea] text-[#555b55] border-[rgba(32,34,31,0.12)] hover:bg-[#eae7de]'
                }`}
              >
                {langCode === 'en' ? 'English' : langCode === 'am' ? 'አማርኛ' : 'Afaan Oromoo'}
              </button>
            ))}
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
      <div className="relative my-3.5 flex items-center justify-center">
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

      {/* Switch to Login Link */}
      {onSwitchToLogin && (
        <div className="mt-3.5 text-center text-xs text-[#6d7068]">
          <span>{t.hasAccountPrompt} </span>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-[#2555d9] hover:underline cursor-pointer"
          >
            {t.loginLink}
          </button>
        </div>
      )}

      {/* Footer Assurance */}
      <div className="mt-3.5 pt-3 border-t border-[rgba(32,34,31,0.08)] flex items-center justify-center gap-1.5 text-[11px] text-[#6d7068]">
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
              aria-label="Close signup modal"
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

export default SignupModal;
