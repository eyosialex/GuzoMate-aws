import { 
  User, 
  AuthSuccessData, 
  LoginCredentials, 
  RegisterPayload, 
  VerifyOtpPayload, 
  RegisterResponseData, 
  VerifyOtpResponseData, 
  ResendOtpResponseData,
  GoogleAuthPayload 
} from '../types/auth';

const PRIMARY_TOKEN_KEY = 'guzomate_token';
const PRIMARY_USER_KEY = 'guzomate_user';
const FALLBACK_TOKEN_KEY = 'guzo_access_token';
const FALLBACK_USER_KEY = 'guzo_user_session';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class AuthApiError extends Error {
  code: string;
  status: number;
  details?: Array<{ path: (string | number)[]; message: string }>;

  constructor(message: string, code: string, status: number, details?: any) {
    super(message);
    this.name = 'AuthApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Normalizes a given phone number into E.164 format.
 * Matches backend normalizePhoneNumber utility:
 * - 0911234567 -> +251911234567
 * - 0712345678 -> +251712345678
 * - 911234567 -> +251911234567
 * - +251911234567 -> +251911234567
 */
export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone || typeof rawPhone !== 'string') return '';
  let cleaned = rawPhone.trim().replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }
  if (/^0[79]\d{8}$/.test(cleaned)) {
    cleaned = '+251' + cleaned.slice(1);
  } else if (/^[79]\d{8}$/.test(cleaned)) {
    cleaned = '+251' + cleaned;
  } else if (/^251[79]\d{8}$/.test(cleaned)) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

export function isValidPhoneNumber(rawPhone: string): boolean {
  if (!rawPhone || typeof rawPhone !== 'string') return false;
  const cleaned = normalizePhoneNumber(rawPhone);
  return /^\+[1-9]\d{7,14}$/.test(cleaned);
}

export function formatDisplayPhone(rawPhone: string): string {
  if (!rawPhone) return '';
  const cleaned = normalizePhoneNumber(rawPhone);
  if (cleaned.startsWith('+251') && cleaned.length === 13) {
    // +251 91 123 4567
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  return rawPhone.trim();
}

export function formatBackendUser(raw: any): User {
  const name = raw.fullName || raw.name || (raw.email ? raw.email.split('@')[0] : null);
  const phone = raw.phoneNumber || raw.phone || '';
  return {
    id: raw.id,
    email: raw.email || '',
    phoneNumber: phone,
    phone,
    name,
    fullName: raw.fullName || name || 'Traveler',
    role: raw.role || 'USER',
    status: raw.status || 'ACTIVE',
    preferredLanguage: (raw.preferredLanguage ? raw.preferredLanguage.toLowerCase() : 'en') as any,
    avatarUrl: raw.avatarUrl,
    isPhoneVerified: Boolean(raw.isPhoneVerified),
    googleId: raw.googleId,
    authProvider: raw.authProvider || (raw.googleId ? 'google' : 'local'),
    authProviders: raw.authProviders,
    scoutGuildBadge: raw.scoutGuildBadge,
    trustRating: raw.trustRating,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export const authService = {
  getStoredToken(): string | null {
    try {
      return localStorage.getItem(PRIMARY_TOKEN_KEY) || localStorage.getItem(FALLBACK_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  getStoredSession(): AuthSuccessData | null {
    try {
      const token = this.getStoredToken();
      const userRaw = localStorage.getItem(PRIMARY_USER_KEY) || localStorage.getItem(FALLBACK_USER_KEY);
      if (!token || !userRaw) return null;
      const user = formatBackendUser(JSON.parse(userRaw));
      return { accessToken: token, user };
    } catch {
      return null;
    }
  },

  /**
   * Phone Number + Password Login.
   * Handles 403 unverified accounts by flagging PHONE_NOT_VERIFIED so the UI
   * can seamlessly direct the user to OTP verification.
   */
  async login(credentials: LoginCredentials): Promise<AuthSuccessData> {
    const rawTarget = (credentials.phoneNumber || credentials.email || '').trim();
    // Normalize phone number if possible, or send as trimmed string
    const phoneNumber = normalizePhoneNumber(rawTarget) || rawTarget;

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber,
        password: credentials.password,
      }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.success) {
      const message = json?.error?.message || json?.message || 'Invalid phone number or password.';
      let code = json?.error?.code;

      if (res.status === 403) {
        if (message.toLowerCase().includes('not verified') || message.toLowerCase().includes('otp')) {
          code = 'PHONE_NOT_VERIFIED';
        } else {
          code = 'FORBIDDEN';
        }
      } else if (res.status === 401) {
        code = 'UNAUTHORIZED';
      } else if (res.status === 429) {
        code = 'RATE_LIMIT_EXCEEDED';
      } else if (!code) {
        code = 'AUTH_ERROR';
      }

      throw new AuthApiError(message, code, res.status, json?.error?.details);
    }

    const session: AuthSuccessData = {
      accessToken: json.data.accessToken,
      user: formatBackendUser(json.data.user),
    };

    this.setSession(session);
    return session;
  },

  /**
   * Phone + Password Traveler Registration.
   * Backend returns unverified user ({ message, user }).
   * If an accessToken is returned (e.g. from mocks), it will persist the session.
   */
  async register(payload: RegisterPayload): Promise<RegisterResponseData> {
    const fullName = (payload.fullName || payload.name || 'Traveler').trim();
    const rawPhone = (payload.phoneNumber || (payload as any).phone || (payload.email ? '+251911000000' : '')).trim();
    const phoneNumber = normalizePhoneNumber(rawPhone) || rawPhone;
    const password = payload.password;
    const confirmPassword = payload.confirmPassword || password;
    const preferredLanguage = payload.preferredLanguage || 'en';

    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        phoneNumber,
        password,
        confirmPassword,
        preferredLanguage,
      }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.success) {
      const code = json?.error?.code || (res.status === 409 ? 'CONFLICT' : res.status === 400 ? 'VALIDATION_ERROR' : 'AUTH_ERROR');
      const message = json?.error?.message || json?.message || 'Registration failed. Please verify your details.';
      throw new AuthApiError(message, code, res.status, json?.error?.details);
    }

    const userData = formatBackendUser(json.data.user);
    const result: RegisterResponseData = {
      message: json.data.message || 'Registration successful. A verification code has been sent to your phone number.',
      user: userData,
      accessToken: json.data.accessToken,
    };

    if (json.data.accessToken) {
      this.setSession({
        accessToken: json.data.accessToken,
        user: userData,
      });
    }

    return result;
  },

  /**
   * Phone Number Verification with 6-digit OTP.
   * On success, marks user verified and sets session with new JWT token.
   */
  async verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResponseData> {
    const phoneNumber = normalizePhoneNumber(payload.phoneNumber) || payload.phoneNumber.trim();
    const otp = payload.otp.trim();

    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber,
        otp,
      }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.success) {
      const code = json?.error?.code || (res.status === 400 ? 'INVALID_OTP' : 'AUTH_ERROR');
      const message = json?.error?.message || json?.message || 'Verification code failed. Please check and try again.';
      throw new AuthApiError(message, code, res.status, json?.error?.details);
    }

    const user = formatBackendUser(json.data.user);
    const session: AuthSuccessData = {
      accessToken: json.data.accessToken,
      user,
    };

    this.setSession(session);

    return {
      message: json.data.message || 'Phone number verified successfully.',
      user,
      accessToken: json.data.accessToken,
    };
  },

  /**
   * Resend fresh OTP verification code to phone number.
   * Subject to 60s cooldown and hourly limits in the backend.
   */
  async resendOtp(phoneNumber: string): Promise<ResendOtpResponseData> {
    const normalized = normalizePhoneNumber(phoneNumber) || phoneNumber.trim();

    const res = await fetch(`${API_BASE}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: normalized,
      }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.success) {
      const code = json?.error?.code || (res.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'AUTH_ERROR');
      const message = json?.error?.message || json?.message || 'Failed to resend code. Please try again.';
      throw new AuthApiError(message, code, res.status, json?.error?.details);
    }

    return {
      message: json.data.message || 'A new verification code has been sent to your phone number.',
    };
  },

  /**
   * Retrieves Google OAuth authorization URL.
   */
  async getGoogleAuthUrl(redirectUri?: string): Promise<string> {
    try {
      const params = new URLSearchParams({ format: 'json' });
      if (redirectUri) params.append('redirectUri', redirectUri);

      const res = await fetch(`${API_BASE}/auth/google?${params.toString()}`);
      const json = await res.json().catch(() => null);
      if (json?.data?.authUrl) {
        return json.data.authUrl;
      }
    } catch {
      // Fallback to direct redirect endpoint
    }
    return `${API_BASE}/auth/google`;
  },

  /**
   * Unified Google Authentication via ID token, code, or access token.
   */
  async googleAuth(payload: GoogleAuthPayload): Promise<AuthSuccessData> {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.success) {
      const code = json?.error?.code || (res.status === 401 ? 'UNAUTHORIZED' : 'AUTH_ERROR');
      const message = json?.error?.message || json?.message || 'Google authentication failed.';
      throw new AuthApiError(message, code, res.status, json?.error?.details);
    }

    const session: AuthSuccessData = {
      accessToken: json.data.accessToken,
      user: formatBackendUser(json.data.user),
      isNewUser: json.data.isNewUser,
    };

    this.setSession(session);
    return session;
  },

  async getCurrentUser(): Promise<User | null> {
    const token = this.getStoredToken();
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          this.clearSession();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth:logout'));
          }
        }
        return null;
      }

      const json = await res.json();
      if (json?.data?.user) {
        const user = formatBackendUser(json.data.user);
        localStorage.setItem(PRIMARY_USER_KEY, JSON.stringify(user));
        localStorage.setItem(FALLBACK_USER_KEY, JSON.stringify(user));
        return user;
      }
      return null;
    } catch {
      return null;
    }
  },

  setSession(session: AuthSuccessData) {
    localStorage.setItem(PRIMARY_TOKEN_KEY, session.accessToken);
    localStorage.setItem(FALLBACK_TOKEN_KEY, session.accessToken);
    localStorage.setItem(PRIMARY_USER_KEY, JSON.stringify(session.user));
    localStorage.setItem(FALLBACK_USER_KEY, JSON.stringify(session.user));
    if (session.user.preferredLanguage) {
      localStorage.setItem('guzo_lang', session.user.preferredLanguage);
    }
  },

  clearSession() {
    localStorage.removeItem(PRIMARY_TOKEN_KEY);
    localStorage.removeItem(FALLBACK_TOKEN_KEY);
    localStorage.removeItem(PRIMARY_USER_KEY);
    localStorage.removeItem(FALLBACK_USER_KEY);
  },
};
