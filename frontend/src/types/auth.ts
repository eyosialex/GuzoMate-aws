import { Language } from './index';

export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  preferredLanguage: Language;
  avatarUrl?: string;
  scoutGuildBadge?: string;
  trustRating?: number;
  phone?: string;
}

export interface AuthSession {
  accessToken: string;
  user: User;
  isMock?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  preferredLanguage: Language;
}
