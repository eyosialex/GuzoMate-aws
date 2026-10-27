import { User, AuthSuccessData, LoginCredentials, RegisterPayload } from '../types/auth';

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

export function formatBackendUser(raw: any): User {
  const name = raw.name || raw.fullName || (raw.email ? raw.email.split('@')[0] : null);
  return {
    id: raw.id,
    email: raw.email,
    name,
    fullName: name || 'Scout',
    role: raw.role || 'USER',
    status: raw.status || 'ACTIVE',
    preferredLanguage: raw.preferredLanguage || 'en',
    avatarUrl: raw.avatarUrl,
    scoutGuildBadge: raw.scoutGuildBadge,
    trustRating: raw.trustRating,
    phone: raw.phone,
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

  async login(credentials: LoginCredentials): Promise<AuthSuccessData> {
    const emailNorm = credentials.email.trim().toLowerCase();

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailNorm,
        password: credentials.password,
      }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.success) {
      const code = json?.error?.code || (res.status === 401 ? 'UNAUTHORIZED' : res.status === 403 ? 'FORBIDDEN' : 'AUTH_ERROR');
      const message = json?.error?.message || json?.message || 'Invalid email or password.';
      throw new AuthApiError(message, code, res.status, json?.error?.details);
    }

    const session: AuthSuccessData = {
      accessToken: json.data.accessToken,
      user: formatBackendUser(json.data.user),
    };

    this.setSession(session);
    return session;
  },

  async register(payload: RegisterPayload): Promise<AuthSuccessData> {
    const emailNorm = payload.email.trim().toLowerCase();

    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailNorm,
        password: payload.password,
        name: payload.name || payload.fullName,
        preferredLanguage: payload.preferredLanguage || 'en',
      }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.success) {
      const code = json?.error?.code || (res.status === 409 ? 'CONFLICT' : res.status === 400 ? 'VALIDATION_ERROR' : 'AUTH_ERROR');
      const message = json?.error?.message || json?.message || 'Registration failed. Please verify your details.';
      throw new AuthApiError(message, code, res.status, json?.error?.details);
    }

    const session: AuthSuccessData = {
      accessToken: json.data.accessToken,
      user: formatBackendUser(json.data.user),
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
