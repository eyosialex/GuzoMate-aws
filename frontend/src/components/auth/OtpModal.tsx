import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../features/useAppStore';
import { authService, AuthApiError, formatDisplayPhone } from '../../services/authService';
import logoImg from '../../assets/logo.png';
import { X, ShieldCheck, ArrowRight, RefreshCw, Smartphone, Edit3, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export interface OtpModalProps {
  isOpen: boolean;
  phoneNumber: string;
  onClose: () => void;
  onSuccess?: (session: any) => void;
  onChangePhone?: () => void;
  isEmbedded?: boolean;
}

interface OtpCopy {
  eyebrow: string;
  titleLead: string;
  titleEm: string;
  subtitle: string;
  changePhone: string;
  digitLabel: string;
  resendPrompt: string;
  resendIn: (seconds: number) => string;
  resendBtn: string;
  resending: string;
  resendSuccess: string;
  submitBtn: string;
  submitting: string;
  footerNote: string;
  errors: {
    incomplete: string;
    generic: string;
  };
}

const otpCopy: Record<'en' | 'am' | 'om', OtpCopy> = {
  en: {
    eyebrow: '02 / SMS Verification',
    titleLead: 'Verify your ',
    titleEm: 'phone.',
    subtitle: 'We sent a 6-digit confirmation code via SMS to',
    changePhone: 'Change phone number',
    digitLabel: 'Enter 6-digit verification code',
    resendPrompt: "Didn't receive the code?",
    resendIn: (s: number) => `Resend code in ${s}s`,
    resendBtn: 'Resend SMS code',
    resending: 'Sending code...',
    resendSuccess: 'A fresh 6-digit code has been dispatched.',
    submitBtn: 'Verify & Sign In',
    submitting: 'Verifying code...',
    footerNote: 'Secured via AfroMessage SMS · Addis Ababa, Ethiopia',
    errors: {
      incomplete: 'Please enter all 6 digits of the verification code.',
      generic: 'Verification failed. Please check the code and try again.',
    },
  },
  am: {
    eyebrow: '02 / የኤስኤምኤስ ማረጋገጫ',
    titleLead: 'ስልክ ቁጥርዎን ',
    titleEm: 'ያረጋግጡ።',
    subtitle: 'ባለ 6 አሃዝ ማረጋገጫ ኮድ በኤስኤምኤስ ተልኳል ወደ',
    changePhone: 'ስልክ ቁጥር ይቀይሩ',
    digitLabel: 'ባለ 6 አሃዝ ማረጋገጫ ኮድ ያስገቡ',
    resendPrompt: 'ኮዱ አልደረሰዎትም?',
    resendIn: (s: number) => `በድጋሚ ለመላክ ${s} ሰከንድ`,
    resendBtn: 'ኮዱን በድጋሚ ላክ',
    resending: 'በመላክ ላይ...',
    resendSuccess: 'አዲስ ባለ 6 አሃዝ ማረጋገጫ ኮድ ተልኳል።',
    submitBtn: 'አረጋግጥ እና ግባ',
    submitting: 'በማረጋገጥ ላይ...',
    footerNote: 'በAfroMessage ኤስኤምኤስ የተጠበቀ · አዲስ አበባ፣ ኢትዮጵያ',
    errors: {
      incomplete: 'እባክዎ ሁሉንም ባለ 6 አሃዝ ኮዶች ያስገቡ።',
      generic: 'ማረጋገጥ አልተሳካም። እባክዎ ኮዱን ፈትሸው እንደገና ይሞክሩ።',
    },
  },
  om: {
    eyebrow: '02 / Mirkaneessa SMS',
    titleLead: 'Bilbila keessan ',
    titleEm: 'mirkaneessaa.',
    subtitle: 'Koodiin mirkaneessaa lakkoofsa 6 qabu gara kanaan ergameera:',
    changePhone: 'Lakkoofsa jijjiiri',
    digitLabel: 'Koodii lakkoofsa 6 galchaa',
    resendPrompt: 'Koodiin isin hin geenye?',
    resendIn: (s: number) => `Sekondii ${s} keessatti deebisaa`,
    resendBtn: 'Koodii deebisii ergi',
    resending: 'Ergamaa jira...',
    resendSuccess: 'Koodiin haaraan lakkoofsa 6 qabu ergameera.',
    submitBtn: 'Mirkaneessi & Seeni',
    submitting: 'Mirkaneessaa jira...',
    footerNote: 'AfroMessage SMS dhaan eegame · Finfinnee, Itoophiyaa',
    errors: {
      incomplete: 'Maaloo koodii lakkoofsa 6 guutuu galchaa.',
      generic: 'Mirkaneeffachuun hin danda’amne. Maaloo irra deebisaa yaalaa.',
    },
  },
};

export const OtpModal: React.FC<OtpModalProps> = ({
  isOpen,
  phoneNumber,
  onClose,
  onSuccess,
  onChangePhone,
  isEmbedded = false,
}) => {
  const { language, setCurrentUser, setPageView } = useAppStore();
  const t: OtpCopy = otpCopy[language as 'en' | 'am' | 'om'] || otpCopy.en;

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown timer
  useEffect(() => {
    if (!isOpen) return;
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, cooldownSeconds]);

  // Focus first input upon opening
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setErrorMsg('');
      setSuccessInfo('');
      const firstInput = inputRefs.current[0];
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 80);
      }
    }
  }, [isOpen, phoneNumber]);

  // Escape key listener
  useEffect(() => {
    if (isEmbedded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isEmbedded]);

  const handleDigitChange = (index: number, val: string) => {
    // Only accept numeric digits
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned) {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      setDigits(nextDigits);
      return;
    }

    // Handle single character
    const char = cleaned.slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = char;
    setDigits(nextDigits);
    setErrorMsg('');

    // Advance focus
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const nextDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      nextDigits[i] = pasted[i] || '';
    }
    setDigits(nextDigits);
    setErrorMsg('');

    // Focus last filled digit or 6th
    const targetIdx = Math.min(pasted.length, 5);
    inputRefs.current[targetIdx]?.focus();

    // Auto-submit if all 6 digits were pasted
    if (pasted.length === 6) {
      submitOtpCode(pasted);
    }
  };

  const submitOtpCode = async (codeToSubmit: string) => {
    if (!phoneNumber) {
      setErrorMsg('Phone number is missing.');
      return;
    }

    if (codeToSubmit.length < 6) {
      setErrorMsg(t.errors.incomplete);
      return;
    }

    setErrorMsg('');
    setSuccessInfo('');
    setIsSubmitting(true);

    try {
      const result = await authService.verifyOtp({
        phoneNumber,
        otp: codeToSubmit,
      });

      setCurrentUser({
        id: result.user.id,
        name: result.user.fullName || result.user.name || result.user.phoneNumber || 'Traveler',
        email: result.user.email || '',
        phone: result.user.phoneNumber || phoneNumber,
        preferredLanguage: result.user.preferredLanguage,
        isGuildVerified: result.user.role !== 'USER' || result.user.trustRating !== undefined,
      });

      confetti({
        particleCount: 80,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#2555d9', '#173aa0', '#e68a3c', '#9fcfdf'],
      });

      if (onSuccess) {
        onSuccess(result);
      } else {
        onClose();
        setPageView('home');
      }
    } catch (err: unknown) {
      if (err instanceof AuthApiError) {
        setErrorMsg(err.message || t.errors.generic);
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(t.errors.generic);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    submitOtpCode(code);
  };

  const handleResend = async () => {
    if (cooldownSeconds > 0 || isResending || !phoneNumber) return;

    setErrorMsg('');
    setSuccessInfo('');
    setIsResending(true);

    try {
      const res = await authService.resendOtp(phoneNumber);
      setSuccessInfo(res.message || t.resendSuccess);
      setCooldownSeconds(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      if (err instanceof AuthApiError) {
        setErrorMsg(err.message);
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to resend code. Please try again.');
      }
    } finally {
      setIsResending(false);
    }
  };

  const content = (
    <div
      role="region"
      aria-labelledby="otp-modal-title"
      lang={language}
      className="relative w-full text-[#20221f]"
      style={{ fontFamily: "'DM Sans', 'Noto Sans Ethiopic', system-ui, -apple-system, sans-serif" }}
    >
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
          id="otp-modal-title"
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

        <div className="flex items-center flex-wrap gap-1.5 text-xs text-[#6d7068] leading-relaxed">
          <span>{t.subtitle}</span>
          <span className="inline-flex items-center gap-1 font-mono font-bold text-[#20221f] bg-[#edeae1] px-2 py-0.5 rounded-md text-[11px]">
            <Smartphone className="w-3 h-3 text-[#2555d9]" />
            {formatDisplayPhone(phoneNumber)}
          </span>
          {onChangePhone && (
            <button
              type="button"
              onClick={onChangePhone}
              className="text-[#2555d9] hover:underline text-[11px] font-medium inline-flex items-center gap-0.5 cursor-pointer ml-0.5"
            >
              <Edit3 className="w-2.5 h-2.5" />
              {t.changePhone}
            </button>
          )}
        </div>
      </div>

      {/* Feedback Messages */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="mb-3.5 p-2.5 rounded-xl bg-[#fbf2f0] border border-[rgba(218,89,63,0.3)] text-xs font-medium text-[#c24128] flex items-start gap-2 overflow-hidden"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#c24128]" />
            <div className="flex-1">{errorMsg}</div>
          </motion.div>
        )}

        {successInfo && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="mb-3.5 p-2.5 rounded-xl bg-[#eef7ee] border border-[rgba(34,140,55,0.3)] text-xs font-medium text-[#1c6e2b] flex items-center gap-2 overflow-hidden"
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#1c6e2b]" />
            <span>{successInfo}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6-Digit Code Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className="block text-[11px] font-semibold tracking-wide uppercase text-[#555b55] mb-2 font-mono"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            {t.digitLabel}
          </label>
          <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={idx === 0 ? handlePaste : undefined}
                aria-label={`Digit ${idx + 1}`}
                className="w-full h-12 text-center text-lg sm:text-xl font-bold font-mono rounded-xl bg-[#f3f1ea] border border-[rgba(32,34,31,0.16)] focus:bg-white focus:border-[#2555d9] focus:ring-3 focus:ring-[#2555d9]/15 text-[#20221f] outline-none transition-all duration-200"
              />
            ))}
          </div>
        </div>

        {/* Resend Code Section */}
        <div className="flex items-center justify-between text-xs text-[#6d7068] pt-1">
          <span>{t.resendPrompt}</span>
          {cooldownSeconds > 0 ? (
            <span className="font-mono text-[11px] font-semibold text-[#839084] bg-[#edeae1] px-2 py-1 rounded-md">
              {t.resendIn(cooldownSeconds)}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="font-semibold text-[#2555d9] hover:text-[#173aa0] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
              <span>{isResending ? t.resending : t.resendBtn}</span>
            </button>
          )}
        </div>

        {/* Action Button */}
        <motion.button
          type="submit"
          disabled={isSubmitting || digits.join('').length < 6}
          whileHover={{ y: -1, boxShadow: '0 10px 24px -4px rgba(37, 85, 217, 0.45)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="w-full py-3 px-4 rounded-xl bg-[#2555d9] hover:bg-[#173aa0] active:bg-[#133085] text-white font-semibold text-xs tracking-wide shadow-[0_8px_20px_-4px_rgba(37,85,217,0.35)] flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
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

      {/* Assurance Footer */}
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
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full border border-[rgba(32,34,31,0.12)] bg-[#f1efe7]/90 hover:bg-[#e7e4d8] text-[#555b55] hover:text-[#20221f] flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#2555d9]/30 cursor-pointer"
              aria-label="Close verification modal"
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

export default OtpModal;
