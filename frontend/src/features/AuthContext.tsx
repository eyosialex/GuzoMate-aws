import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  LoginCredentials, 
  RegisterPayload, 
  VerifyOtpPayload, 
  GoogleAuthPayload,
  RegisterResponseData 
} from '../types/auth';
import { authService } from '../services/authService';
import { useAppStore } from './useAppStore';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<RegisterResponseData | void>;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<void>;
  resendOtp: (phoneNumber: string) => Promise<void>;
  googleAuth: (payload: GoogleAuthPayload) => Promise<void>;
  logout: () => void;
  updateUserPreferences: (prefs: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore existing session on mount & listen for global logout
  useEffect(() => {
    let isMounted = true;

    const handleGlobalLogout = () => {
      if (isMounted) {
        setUser(null);
        useAppStore.getState().setCurrentUser(null);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:logout', handleGlobalLogout);
    }

    try {
      const session = authService.getStoredSession();
      if (session) {
        setUser(session.user);
        useAppStore.getState().setCurrentUser(session.user as any);
        // Refresh profile in background
        authService.getCurrentUser().then((refreshed) => {
          if (isMounted && refreshed) {
            setUser(refreshed);
            useAppStore.getState().setCurrentUser(refreshed as any);
          }
        });
      }
    } catch (e) {
      console.error('Session restoration error', e);
    } finally {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth:logout', handleGlobalLogout);
      }
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const session = await authService.login(credentials);
      setUser(session.user);
      useAppStore.getState().setCurrentUser(session.user as any);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const result = await authService.register(payload);
      if (result.accessToken && result.user) {
        setUser(result.user);
        useAppStore.getState().setCurrentUser(result.user as any);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (payload: VerifyOtpPayload) => {
    setIsLoading(true);
    try {
      const session = await authService.verifyOtp(payload);
      setUser(session.user);
      useAppStore.getState().setCurrentUser(session.user as any);
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async (phoneNumber: string) => {
    await authService.resendOtp(phoneNumber);
  };

  const googleAuth = async (payload: GoogleAuthPayload) => {
    setIsLoading(true);
    try {
      const session = await authService.googleAuth(payload);
      setUser(session.user);
      useAppStore.getState().setCurrentUser(session.user as any);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.clearSession();
    setUser(null);
    useAppStore.getState().setCurrentUser(null);
  };

  const updateUserPreferences = (prefs: Partial<User>) => {
    const base = user || authService.getStoredSession()?.user;
    if (!base) return;
    const updated = { ...base, ...prefs };
    setUser(updated);
    useAppStore.getState().setCurrentUser(updated as any);
    try {
      localStorage.setItem('guzo_user_session', JSON.stringify(updated));
      localStorage.setItem('guzomate_user', JSON.stringify(updated));
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        verifyOtp,
        resendOtp,
        googleAuth,
        logout,
        updateUserPreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
