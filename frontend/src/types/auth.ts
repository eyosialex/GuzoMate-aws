export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';
export type SupportedLanguage = 'en' | 'am' | 'om';

export interface User {
  id: string;
  email: string;
  name: string | null;
  fullName?: string;
  role: UserRole;
  status: UserStatus;
  preferredLanguage: SupportedLanguage;
  avatarUrl?: string;
  scoutGuildBadge?: string;
  trustRating?: number;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
  fullName?: string;
  preferredLanguage?: SupportedLanguage;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginCredentials extends LoginPayload {
  rememberMe?: boolean;
}

export interface AuthSuccessData {
  user: User;
  accessToken: string;
}

export type AuthSession = AuthSuccessData;

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{
      path: (string | number)[];
      message: string;
    }>;
  };
}
