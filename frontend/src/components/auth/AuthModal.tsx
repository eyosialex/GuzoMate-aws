import React, { useState } from 'react';
import { useAppStore } from '../../features/useAppStore';
import { authService, AuthApiError } from '../../services/authService';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  Compass,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

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

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const emailNorm = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailNorm || !emailRegex.test(emailNorm)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    if (authModalTab === 'signup') {
      const isPasswordValid = password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
      if (!isPasswordValid) {
        setErrorMsg('Password must be at least 8 characters and contain at least one letter and one number.');
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
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1b4332', '#d97706', '#0e7490'],
      });
    } catch (err: unknown) {
      if (err instanceof AuthApiError) {
        if (err.code === 'CONFLICT') {
          setErrorMsg('An account with this email address already exists. Please sign in instead.');
        } else if (err.code === 'UNAUTHORIZED') {
          setErrorMsg('Invalid email or password.');
        } else if (err.code === 'FORBIDDEN') {
          setErrorMsg('Your account has been suspended by moderation.');
        } else if (err.code === 'RATE_LIMIT_EXCEEDED') {
          setErrorMsg('Too many attempts. Please try again in 15 minutes.');
        } else {
          setErrorMsg(err.message);
        }
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Authentication failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Modal Dialog Card */}
      <div 
        className="w-full max-w-md bg-surface-lowest rounded-3xl border border-outline-variant/50 shadow-2xl overflow-hidden p-6 sm:p-8 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-full text-ash hover:text-on-surface hover:bg-surface-low transition-colors"
          aria-label="Close authentication modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white mx-auto flex items-center justify-center shadow-md mb-3">
            <Compass className="w-6 h-6 text-secondary-light" />
          </div>
          <h2 className="text-2xl font-display font-extrabold text-on-surface">
            {authModalTab === 'login' ? 'Welcome Back' : 'Create Your Account'}
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Access verified highland routes, saved places, and hazard alerts.
          </p>
        </div>

        {/* Tab Toggle: Sign In vs Sign Up */}
        <div className="flex items-center p-1 bg-surface-low rounded-2xl border border-outline-variant/40 mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              openAuthModal('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              authModalTab === 'login'
                ? 'bg-white text-primary shadow-sm'
                : 'text-ash hover:text-on-surface'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              openAuthModal('signup');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              authModalTab === 'signup'
                ? 'bg-white text-primary shadow-sm'
                : 'text-ash hover:text-on-surface'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authModalTab === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Full Name
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-ash absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-low border border-transparent focus:border-primary focus:bg-white text-xs font-medium text-on-surface outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              Email or Phone Number
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-ash absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email or phone"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-low border border-transparent focus:border-primary focus:bg-white text-xs font-medium text-on-surface outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-ash absolute left-3 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-surface-low border border-transparent focus:border-primary focus:bg-white text-xs font-medium text-on-surface outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-ash hover:text-on-surface"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {authModalTab === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Phone Number (for SMS hazard alerts)
              </label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-ash absolute left-3 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 9... or +251 7..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-low border border-transparent focus:border-primary focus:bg-white text-xs font-medium text-on-surface outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            className="w-full mt-2 py-3 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-highland flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01]"
          >
            <span>{authModalTab === 'login' ? 'Sign In' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Guild Verification Assurance Footer */}
        <div className="mt-5 pt-3 border-t border-outline-variant/20 flex items-center justify-center gap-1.5 text-[11px] text-ash">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Protected with 256-bit highland data encryption.</span>
        </div>

      </div>

    </div>
  );
};
