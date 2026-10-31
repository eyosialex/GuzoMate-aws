import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { authService } from '../../services/authService';
import { useAppStore } from '../../features/useAppStore';

interface GoogleAuthButtonProps {
  label?: string;
  className?: string;
  disabled?: boolean;
  onInitiate?: () => void;
}

const googleLabels: Record<'en' | 'am' | 'om', string> = {
  en: 'Continue with Google',
  am: 'በGoogle ይቀጥሉ',
  om: "Google'n itti fufaa",
};

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  label,
  className = '',
  disabled = false,
  onInitiate,
}) => {
  const { language } = useAppStore();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const buttonText = label || googleLabels[language as 'en' | 'am' | 'om'] || googleLabels.en;

  const handleClick = async () => {
    if (disabled || isRedirecting) return;
    setIsRedirecting(true);
    if (onInitiate) onInitiate();

    try {
      const authUrl = await authService.getGoogleAuthUrl();
      if (typeof window !== 'undefined') {
        window.location.href = authUrl;
      }
    } catch {
      // Direct redirect fallback
      if (typeof window !== 'undefined') {
        window.location.href = '/api/v1/auth/google';
      }
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={disabled || isRedirecting}
      whileHover={{ y: -1, boxShadow: '0 4px 14px rgba(32,34,31,0.08)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      aria-label={buttonText}
      className={`w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#fbfbfa] active:bg-[#f3f1ea] border border-[rgba(32,34,31,0.16)] text-[#20221f] text-xs font-semibold flex items-center justify-center gap-2.5 transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${className}`}
      style={{ fontFamily: "'DM Sans', 'Noto Sans Ethiopic', system-ui, sans-serif" }}
    >
      {isRedirecting ? (
        <div className="w-4 h-4 border-2 border-[#20221f]/20 border-t-[#20221f] rounded-full animate-spin" />
      ) : (
        <svg
          className="w-4 h-4 shrink-0"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      )}
      <span className="truncate">{buttonText}</span>
    </motion.button>
  );
};

export default GoogleAuthButton;
