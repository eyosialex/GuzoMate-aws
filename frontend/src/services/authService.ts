import { User, AuthSession, LoginCredentials, RegisterPayload } from '../types/auth';

const TOKEN_KEY = 'guzo_access_token';
const USER_KEY = 'guzo_user_session';
const USERS_REGISTRY_KEY = 'guzo_registered_users';

// Pre-configured development mock users matching UI references
export const MOCK_USERS: User[] = [
  {
    id: 'usr-dawit-01',
    email: 'dawit@guzomate.et',
    fullName: 'Dawit A.',
    role: 'USER',
    preferredLanguage: 'en',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    scoutGuildBadge: 'Selam Guild #418',
    trustRating: 98.4,
    phone: '+251 91 123 4567',
  },
  {
    id: 'usr-eden-02',
    email: 'traveler@guzomate.et',
    fullName: 'Eden B.',
    role: 'USER',
    preferredLanguage: 'am',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    scoutGuildBadge: 'Addis Explorer',
    trustRating: 95.0,
    phone: '+251 92 987 6543',
  },
  {
    id: 'usr-fikru-03',
    email: 'moderator@guzomate.et',
    fullName: 'Lt. Fikru Tadesse',
    role: 'MODERATOR',
    preferredLanguage: 'om',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    scoutGuildBadge: 'Sheno Sector Commander',
    trustRating: 99.8,
    phone: '+251 93 456 7890',
  },
];

function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_REGISTRY_KEY);
    if (!raw) return MOCK_USERS;
    const custom = JSON.parse(raw);
    return [...MOCK_USERS, ...custom];
  } catch {
    return MOCK_USERS;
  }
}

function saveRegisteredUser(user: User) {
  try {
    const raw = localStorage.getItem(USERS_REGISTRY_KEY);
    const custom: User[] = raw ? JSON.parse(raw) : [];
    if (!custom.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
      custom.push(user);
      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(custom));
    }
  } catch (e) {
    console.error('Failed to save user to registry', e);
  }
}

export const authService = {
  getStoredSession(): AuthSession | null {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const userRaw = localStorage.getItem(USER_KEY);
      if (!token || !userRaw) return null;
      const user = JSON.parse(userRaw) as User;
      return { accessToken: token, user };
    } catch {
      return null;
    }
  },

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const emailNorm = credentials.email.trim().toLowerCase();

    // 1. Attempt connection to real backend if available
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailNorm,
          password: credentials.password,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json?.data?.accessToken && json?.data?.user) {
          const session: AuthSession = {
            accessToken: json.data.accessToken,
            user: json.data.user,
            isMock: false,
          };
          this.setSession(session);
          return session;
        }
      }
    } catch {
      // Backend not running; proceed with development fallback
    }

    // 2. Development Mock Authentication Fallback
    const users = getStoredUsers();
    let found = users.find(u => u.email.toLowerCase() === emailNorm);

    // If matching demo password or default test credentials
    if (!found) {
      if (credentials.password.length >= 6) {
        // Create an on-the-fly local demo user for testing convenience
        found = {
          id: `usr-${Date.now()}`,
          email: credentials.email,
          fullName: credentials.email.split('@')[0].toUpperCase(),
          role: 'USER',
          preferredLanguage: 'en',
          trustRating: 92.0,
          scoutGuildBadge: 'Highland Traveler',
        };
        saveRegisteredUser(found);
      } else {
        throw new Error('Invalid email or password. Password must be at least 6 characters.');
      }
    } else if (credentials.password.length < 6) {
      throw new Error('Invalid password. Minimum 6 characters required.');
    }

    const session: AuthSession = {
      accessToken: `mock-jwt-${found.id}-${Date.now()}`,
      user: found,
      isMock: true,
    };

    this.setSession(session);
    return session;
  },

  async register(payload: RegisterPayload): Promise<AuthSession> {
    const emailNorm = payload.email.trim().toLowerCase();

    // 1. Attempt connection to real backend if available
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json?.data?.accessToken && json?.data?.user) {
          const session: AuthSession = {
            accessToken: json.data.accessToken,
            user: json.data.user,
            isMock: false,
          };
          this.setSession(session);
          return session;
        }
      }
    } catch {
      // Backend not running; proceed with development fallback
    }

    // 2. Development Mock Registration Fallback
    const users = getStoredUsers();
    const existing = users.find(u => u.email.toLowerCase() === emailNorm);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const newUser: User = {
      id: `usr-reg-${Date.now()}`,
      email: payload.email,
      fullName: payload.fullName,
      role: 'USER',
      preferredLanguage: payload.preferredLanguage || 'en',
      trustRating: 90.0,
      scoutGuildBadge: 'Verified Passenger',
    };

    saveRegisteredUser(newUser);

    const session: AuthSession = {
      accessToken: `mock-jwt-${newUser.id}-${Date.now()}`,
      user: newUser,
      isMock: true,
    };

    this.setSession(session);
    return session;
  },

  setSession(session: AuthSession) {
    localStorage.setItem(TOKEN_KEY, session.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    // Also sync preferred language
    if (session.user.preferredLanguage) {
      localStorage.setItem('guzo_lang', session.user.preferredLanguage);
    }
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
